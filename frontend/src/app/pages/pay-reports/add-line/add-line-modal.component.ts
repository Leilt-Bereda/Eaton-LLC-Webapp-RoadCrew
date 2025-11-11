import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, Subscription, switchMap, tap, catchError, of } from 'rxjs';
import { PayReportLine } from 'src/app/models/pay-report.model';
import { JobsService, PayReportsService, JobLite } from '../../../services/pay-reports.service';

@Component({
  selector: 'app-add-line-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-line-modal.component.html',
  styleUrls: ['./add-line-modal.component.scss']
})
export class AddLineModalComponent implements OnInit, OnDestroy {
  @Input() open = false;
  @Input() reportId!: number;
  @Input() weekStart!: string;   // "YYYY-MM-DD"
  @Input() weekEnd!: string;

  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<PayReportLine>();

  jobLoading = false;
  jobError = '';
  saving = false;

  suggestions: JobLite[] = [];
  showSuggestions = false;

  private subs = new Subscription();

  form = this.fb.group({
    date: ['', Validators.required],
    jobNumber: ['', Validators.required],
    truckNumber: ['', Validators.required],
    trailerNumber: [''],

    loaded: [''],
    unloaded: [''],
    weightOrHour: [0],
    truckPaid: [0],
    total: [0],
    trailerRent: [0],
    brokerCharge: [0],
    contractorPaid: [0]
  });

  constructor(
    private fb: FormBuilder,
    private jobs: JobsService,
    private reports: PayReportsService
  ) {}

  ngOnInit(): void {
    // Prefill date to weekStart (optional)
    this.form.patchValue({ date: this.weekStart });

    // --- Live job search for suggestions (typeahead) ---
    const suggestSub = this.form.controls.jobNumber.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      tap(() => { this.showSuggestions = false; this.jobError = ''; }),
      filter(v => !!v && String(v).trim().length >= 2),
      switchMap((q: string) =>
        this.jobs.search(q.trim()).pipe(
          catchError(() => of([] as JobLite[]))
        )
      )
    ).subscribe(list => {
      this.suggestions = list;
      this.showSuggestions = list.length > 0;
    });

    // --- Auto-fill from exact job number (convenience) ---
    const autoFillSub = this.form.controls.jobNumber.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(v => !!v && String(v).trim().length >= 2),
      tap(() => { this.jobLoading = true; this.jobError = ''; }),
      switchMap(jobNo =>
        this.jobs.getByJobNumber(String(jobNo).trim()).pipe(
          catchError(() => of(null)),
          tap(() => this.jobLoading = false)
        )
      )
    ).subscribe(job => {
      if (job) this.applyJobAutoFill(job);
    });

    // --- Preview totals on client (server remains source of truth) ---
    const recompute = this.form.valueChanges.subscribe(v => {
      const weight = Number(v?.weightOrHour) || 0;
      const rate = Number(v?.truckPaid) || 0;
      const total = Number(v?.total) || (weight * rate);
      this.form.patchValue({ total }, { emitEvent: false });
    });

    this.subs.add(suggestSub);
    this.subs.add(autoFillSub);
    this.subs.add(recompute);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ---- UI helpers ----
  trackByJobId = (_: number, j: JobLite) => j.id;

  onJobFieldBlur() {
    // small delay so click on suggestion can register before closing
    setTimeout(() => this.showSuggestions = false, 150);
  }

  pickSuggestion(job: JobLite) {
    // Set the job number (triggers auto-fill stream) and apply snapshots immediately
    this.form.patchValue({ jobNumber: job.job_number }, { emitEvent: true });
    this.applyJobAutoFill(job);
    this.showSuggestions = false;
  }

  private applyJobAutoFill(job: JobLite | any) {
    const loaded = job.loading_address_info
      ? (job.loading_address_info.location_name || job.loading_address_info.street_address || '')
      : '';
    const unloaded = job.unloading_address_info
      ? (job.unloading_address_info.location_name || job.unloading_address_info.street_address || '')
      : '';

    const basePatch: any = { loaded, unloaded };
    const controlNames = Object.keys(this.form.controls);
    for (const key of controlNames) {
      if (key in job) basePatch[key] = job[key];
    }
    if (job.defaultTruckPaid != null && basePatch.truckPaid == null) basePatch.truckPaid = Number(job.defaultTruckPaid) || 0;
    if (job.defaultTrailerRent != null && basePatch.trailerRent == null) basePatch.trailerRent = Number(job.defaultTrailerRent) || 0;
    if (job.defaultBrokerCharge != null && basePatch.brokerCharge == null) basePatch.brokerCharge = Number(job.defaultBrokerCharge) || 0;
    if (job.defaultContractorPaid != null && basePatch.contractorPaid == null) basePatch.contractorPaid = Number(job.defaultContractorPaid) || 0;

    this.form.patchValue(basePatch, { emitEvent: false });
  }

  // ---- Modal controls ----
  close(): void {
    this.closed.emit();
  }

  // ---- Save line ----
  save(): void {
    if (this.form.invalid || !this.reportId) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;

    // Backend expects PayReportLine fields
    const payload = {
      date: this.form.value.date,
      jobNumber: this.form.value.jobNumber,
      truckNumber: this.form.value.truckNumber,
      trailerNumber: this.form.value.trailerNumber,
      loaded: this.form.value.loaded,
      unloaded: this.form.value.unloaded,
      weightOrHour: Number(this.form.value.weightOrHour) || 0,
      truckPaid: Number(this.form.value.truckPaid) || 0,
      total: Number(this.form.value.total) || 0,
      trailerRent: Number(this.form.value.trailerRent) || 0,
      brokerCharge: Number(this.form.value.brokerCharge) || 0,
      contractorPaid: Number(this.form.value.contractorPaid) || 0
    } as any;

    // Use top-level pay-report-lines endpoint
    this.reports.createLineTop(this.reportId, payload).subscribe({
      next: (created) => {
        this.saving = false;
        this.created.emit(created);
        this.close();
      },
      error: (err) => {
        this.saving = false;
        this.jobError = 'Unable to save. Please try again.';
        console.error(err);
      }
    });
  }
}
