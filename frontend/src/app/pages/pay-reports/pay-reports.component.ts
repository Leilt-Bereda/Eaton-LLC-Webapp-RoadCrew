// src/app/pages/pay-reports/pay-reports.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// import your interfaces from app-level models
import { PayReportHeader } from 'src/app/models/pay-report.model';
// or: import { PayReportHeader } from '../../models/pay-report.model';

// If <app-card> lives in a SharedModule, import it here
import { SharedModule } from 'src/app/theme/shared/shared.module';

// UI-only extension to track selection in the table
type PayReportHeaderRow = PayReportHeader & { selected?: boolean };

@Component({
  selector: 'app-pay-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedModule],
  templateUrl: './pay-reports.component.html',
  styleUrls: ['./pay-reports.component.scss']
})
export class PayReportsComponent implements OnInit {

  // Filters bound in the template
  filters = { driver: '', from: '', to: '' };

  // Full list from API (stub for now) — note the UI type with `selected?`
  private allReports: PayReportHeaderRow[] = [
    {
      id: 1,
      driverId: 12,
      driverName: 'Mecarrthi',
      weekStart: '2025-08-04',
      weekEnd: '2025-08-10',
      totalWeightOrHours: 48,
      totalTruckPaid: 650,
      totalAmount: 6240,
      totalDue: 6240,
      fuelProgram: 0,
      fuelPilotOrKT: 0,
      fuelSurcharge: 0,
      selected: false
    },
    {
      id: 2,
      driverId: 27,
      driverName: 'John Doe',
      weekStart: '2025-08-11',
      weekEnd: '2025-08-17',
      totalWeightOrHours: 52,
      totalTruckPaid: 720,
      totalAmount: 7015,
      totalDue: 7015,
      selected: false
    }
  ];

  // Table data & selection
  reports: PayReportHeaderRow[] = [];
  selected: PayReportHeaderRow[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.reports = [...this.allReports];
  }

  trackById = (_: number, r: PayReportHeaderRow) => r.id;

  onSelect(): void {
    this.selected = this.reports.filter(r => !!r.selected);
  }

  applyFilters(): void {
    const d = (this.filters.driver || '').toLowerCase();
    const from = this.filters.from;
    const to = this.filters.to;

    // Filter from backing store; selection state is preserved because we reuse the same objects
    this.reports = this.allReports.filter(r => {
      const mDriver = d ? r.driverName.toLowerCase().includes(d) : true;
      const mFrom = from ? r.weekStart >= from : true; // ISO date strings compare fine
      const mTo = to ? r.weekEnd <= to : true;
      return mDriver && mFrom && mTo;
    });

    this.onSelect();
  }

  navigateToCreateReport(): void {
    // this.router.navigate(['/pay-reports/new']);
    console.log('navigateToCreateReport');
  }

}
