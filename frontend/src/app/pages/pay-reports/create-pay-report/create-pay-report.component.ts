// create-pay-report.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { PayReportsService, Driver } from 'src/app/services/pay-reports.service';

@Component({
  selector: 'app-create-pay-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-pay-report.component.html'
})
export class CreatePayReportComponent implements OnInit {
  saving = false;
  errorMsg = '';
  successMsg = '';

  drivers: Driver[] = [];
  loadingDrivers = false;

  form = this.fb.group({
    weekStart: ['', Validators.required],
    weekEnd:   ['', Validators.required],
    driverId:  [null as number | null, Validators.required],   // ← use id
  });

  constructor(private fb: FormBuilder, private svc: PayReportsService, private router: Router) {}

  ngOnInit(): void {
    this.fetchDrivers();
  }

  private fetchDrivers(): void {
    this.loadingDrivers = true;
    this.svc.listDrivers()
      .pipe(finalize(() => (this.loadingDrivers = false)))
      .subscribe({
        next: (list) => (this.drivers = list || []),
        error: () => { this.errorMsg = 'Could not load drivers.'; this.drivers = []; }
      });
  }

  save(): void {
    this.errorMsg = '';
    this.successMsg = '';

    const { weekStart, weekEnd, driverId } = this.form.getRawValue();

    if (!weekStart || !weekEnd) {
      this.errorMsg = 'Please select a week range.';
      return;
    }
    if (weekStart > weekEnd) {
      this.form.controls.weekEnd.setErrors({ range: true });
      this.errorMsg = 'End date must be on or after start date.';
      return;
    }
    if (!driverId) {
      this.errorMsg = 'Please select a driver.';
      return;
    }

    const driverName = this.drivers.find(d => d.id === driverId)?.name;

    this.saving = true;
    this.svc.createReportResponse({ weekStart, weekEnd, driverName })  // name is optional
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (resp) => {
          let id = resp.body?.id as number | undefined;
          if (!id) {
            const loc = resp.headers.get('Location') || resp.headers.get('location');
            id = loc?.match(/\/pay-reports\/(\d+)/i)?.[1] ? Number(RegExp.$1) : undefined;
          }
          if (!id) {
            this.errorMsg = 'Report created but no ID returned. Please refresh the list.';
            return;
          }
          this.successMsg = 'Report created.';
          this.router.navigate(['/pay-reports', id]);
        },
        error: (err) => {
          console.error('[CreateReport] error', err);
          this.errorMsg = err?.error?.message || 'Unable to create report. Please try again.';
        }
      });
  }

  cancel(): void { this.router.navigate(['/pay-reports']); }
}
