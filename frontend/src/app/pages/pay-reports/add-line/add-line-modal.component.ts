// src/app/pages/open-pay-report/add-line-modal.component.ts
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, Subscription, switchMap, tap, catchError, of } from 'rxjs';
import { PayReportLine } from 'src/app/models/pay-report.model';
import { JobsService, PayReportsService } from '../../../services/pay-reports.service';


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

  private subs = new Subscription();

  form = this.fb.group({
    date: ['', Validators.required],
    driverName: ['', Validators.required],
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
    // prefill date to weekStart (optional)
    this.form.patchValue({ date: this.weekStart });

    // Debounce job number input and fetch job details
    const sub = this.form.controls.jobNumber.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(v => !!v && String(v).trim().length >= 2),
      tap(() => { this.jobLoading = true; this.jobError = ''; }),
      switchMap(jobNo =>
        this.jobs.getByJobNumber(String(jobNo).trim()).pipe(
          catchError(err => {
            this.jobError = 'Job not found.';
            return of(null);
          }),
          tap(() => this.jobLoading = false)
        )
      )
    ).subscribe(job => {
      if (!job) return;

      // Auto-fill form fields from job
      this.form.patchValue({
        loaded: job.loadingAddress ?? '',
        unloaded: job.unloadingAddress ?? '',
        truckPaid: job.defaultTruckPaid ?? 0,
        // You can auto-set 'weightOrHour' default or leave as 0
      });

      // Optional: preview Total as weightOrHour * truckPaid when either changes
    });

    // Recompute totals on relevant changes (simple preview; backend is source of truth)
    const recompute = this.form.valueChanges.subscribe(v => {
      const weight = Number(v.weightOrHour) || 0;
      const truckPaid = Number(v.truckPaid) || 0;
      const total = Number(v.total) || (weight * truckPaid);
      this.form.patchValue({ total }, { emitEvent: false });
    });

    this.subs.add(sub);
    this.subs.add(recompute);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  close(): void {
    this.closed.emit();
  }

  save(): void {
    if (this.form.invalid || !this.reportId) return;
    this.saving = true;

    const payload = { ...this.form.value } as any;

    this.reports.createLine(this.reportId, payload).subscribe({
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
