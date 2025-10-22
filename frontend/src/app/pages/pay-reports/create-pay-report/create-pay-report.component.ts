// create-pay-report.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { PayReportsService } from 'src/app/services/pay-reports.service';

@Component({
  selector: 'app-create-pay-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-pay-report.component.html'
})
export class CreatePayReportComponent {
  saving = false;
  errorMsg = '';
  successMsg = '';

  form = this.fb.group({
    weekStart: ['', Validators.required],
    weekEnd:   ['', Validators.required],
    driverName: ['']
  });

  constructor(private fb: FormBuilder, private svc: PayReportsService, private router: Router) {}

  save(): void {
    this.errorMsg = '';
    this.successMsg = '';

    const { weekStart, weekEnd, driverName } = this.form.getRawValue();

    if (!weekStart || !weekEnd) {
      this.errorMsg = 'Please select a week range.';
      return;
    }
    if (weekStart > weekEnd) {
      this.form.controls.weekEnd.setErrors({ range: true });
      this.errorMsg = 'End date must be on or after start date.';
      return;
    }

    this.saving = true;
    console.log('[CreateReport] payload', { weekStart, weekEnd, driverName });

    this.svc.createReportResponse({ weekStart, weekEnd, driverName: driverName || undefined })
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (resp) => {
          // Support both: body with id, or 201 Created with Location header
          const body: any = resp.body;
          let id = body?.id as number | undefined;

          if (!id) {
            const loc = resp.headers.get('Location') || resp.headers.get('location');
            if (loc) {
              // Expect server to return like /api/pay-reports/123
              const m = loc.match(/\/pay-reports\/(\d+)/i);
              id = m ? Number(m[1]) : undefined;
            }
          }

          if (!id) {
            this.errorMsg = 'Report created but no ID returned. Please refresh the list.';
            console.warn('[CreateReport] Missing id in response', resp);
            return;
          }

          this.successMsg = 'Report created.';
          console.log('[CreateReport] navigating to', id);
          this.router.navigate(['/pay-reports', id]);
        },
        error: (err) => {
          console.error('[CreateReport] error', err);
          this.errorMsg = (err?.error?.message) || 'Unable to create report. Please try again.';
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/pay-reports']);
  }
}
