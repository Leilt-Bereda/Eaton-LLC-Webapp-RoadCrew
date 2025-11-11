import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { PayReportHeader } from 'src/app/models/pay-report.model';

import { SharedModule } from 'src/app/theme/shared/shared.module';
import { PayReportsService } from '../../services/pay-reports.service';
import { NewPayReportDialogComponent, NewPayReportResult } from './shared/new-pay-report-dialog/new-pay-report-dialog.component';

type PayReportHeaderRow = PayReportHeader & { selected?: boolean };

@Component({
  selector: 'app-pay-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, NewPayReportDialogComponent],
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

  constructor(private router: Router, private svc: PayReportsService) {}

  ngOnInit(): void { this.loadFromApi(); }

  private loadFromApi(): void {
    this.svc.list().subscribe({
      next: (list: any) => {
        this.allReports = (list || []).map((h: any) => ({ ...h, selected: false }));
        this.applyFilters();
      },
      error: () => { this.reports = [...this.allReports]; }
    });
  }

  trackById = (_: number, r: PayReportHeaderRow) => r.id;

  onSelect(): void {
    this.selected = this.reports.filter(r => !!r.selected);
  }

  open(id: number): void { this.router.navigate(['/pay-reports', id]); }
  edit(id: number): void { this.router.navigate(['/pay-reports', id], { queryParams: { add: '1' } }); }
  delete(id: number): void {
    if (!confirm('Are you sure you want to delete this pay report?')) return;
    this.allReports = this.allReports.filter(r => r.id !== id);
    this.applyFilters();
  }
  deleteSelected(): void {
    if (this.selected.length === 0) return;
    const message = `Are you sure you want to delete ${this.selected.length} selected report(s)?`;
    if (!confirm(message)) return;
    const ids = new Set(this.selected.map(s => s.id));
    this.allReports = this.allReports.filter(r => !ids.has(r.id));
    this.selected = [];
    this.applyFilters();
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

  // New Report dialog
  showNewModal = false;
  drivers = [
    { id: 12, name: 'Mecarrthi' },
    { id: 27, name: 'John Doe' },
    { id: 33, name: 'Jane Smith' }
  ];
  openNewReportDialog(): void { this.showNewModal = true; }
  onCloseNew(): void { this.showNewModal = false; }
  onSaveNew(result: NewPayReportResult): void {
    this.showNewModal = false;
    const driverName = this.drivers.find(d => d.id === result.driverId)?.name ?? 'Driver';
    this.svc.createReport({ weekStart: result.weekStart, weekEnd: result.weekEnd, driverId: result.driverId, driverName })
      .subscribe({
        next: (created: any) => {
          this.loadFromApi();
          const id = created?.id ?? 0;
          this.router.navigate(['/pay-reports', id], { queryParams: { driver: driverName, from: result.weekStart, to: result.weekEnd, add: '1' } });
        },
        error: () => this.loadFromApi()
      });
  }

}
