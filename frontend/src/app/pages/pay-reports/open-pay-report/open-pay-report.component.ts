import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PayReport, PayReportLine } from 'src/app/models/pay-report.model';
import { PAY_REPORTS_MOCK } from './mock-pay-reports';
import { PayReportsService } from '../../../services/pay-reports.service';
import { AddLineModalComponent } from '../add-line/add-line-modal.component';

type NumericLineKeys =
  | 'weightOrHour'
  | 'truckPaid'
  | 'total'
  | 'trailerRent'
  | 'brokerCharge'
  | 'contractorPaid';

@Component({
  selector: 'app-open-pay-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AddLineModalComponent],
  templateUrl: './open-pay-report.component.html',
  styleUrls: ['./open-pay-report.component.scss']
})
export class OpenPayReportComponent implements OnInit {
  @ViewChild('reportArea') reportArea?: ElementRef<HTMLElement>;

  id!: number;
  report!: PayReport;
  addOpen = false;
  isEditing = false;
  editingLine: PayReportLine | null = null;

  constructor(private route: ActivatedRoute, private svc: PayReportsService) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    const qp = this.route.snapshot.queryParamMap;
    this.svc.getReport(this.id).subscribe({
      next: (r) => {
        this.report = r as any;
      },
      error: () => {
    const mock = PAY_REPORTS_MOCK[this.id];
    if (mock) {
          this.report = { ...mock } as any;
    } else {
          // Initialize from query params
          this.report = {
            id: this.id,
            driverId: 0,
            driverName: qp.get('driver') ?? 'Driver',
            weekStart: qp.get('from') ?? '',
            weekEnd: qp.get('to') ?? '',
            lines: [],
            totalWeightOrHours: 0,
            totalTruckPaid: 0,
            totalAmount: 0,
            totalDue: 0,
            fuelProgram: 0,
            fuelPilotOrKT: 0,
            fuelSurcharge: 0
          } as any;
        }
      }
    });
    if (qp.get('add') === '1') setTimeout(() => this.openAddModal(), 0);
  }
  openAddModal() { this.addOpen = true; }
  onModalClosed() { this.addOpen = false; }
  onLineCreated(line: PayReportLine) {
    this.report.lines.push(line);
    // Recompute rollups
    const sum = (k: keyof PayReportLine) => this.report.lines.reduce((s, l) => s + (Number(l[k]) || 0), 0);
    this.report.totalWeightOrHours = sum('weightOrHour');
    this.report.totalTruckPaid = sum('truckPaid');
    this.report.totalAmount = sum('total');
    this.report.totalDue = this.report.totalAmount
      + (this.report.fuelProgram ?? 0)
      + (this.report.fuelPilotOrKT ?? 0)
      + (this.report.fuelSurcharge ?? 0);

      this.addOpen = false;
  }

  toggleEdit(): void { 
    this.isEditing = !this.isEditing;
    if (!this.isEditing) this.editingLine = null;
  }
  saveReport(): void { 
    // TODO: Save to backend
    this.isEditing = false;
  }

  editLineItem(line: PayReportLine): void {
    this.editingLine = { ...line };
  }

  saveLineItem(): void {
    if (!this.editingLine || !this.report) return;
    const index = this.report.lines.findIndex(item => item.id === this.editingLine!.id);
    if (index !== -1) {
      // Auto-calculate total
      this.editingLine.total = (Number(this.editingLine.weightOrHour) || 0) * (Number(this.editingLine.truckPaid) || 0);
      this.report.lines[index] = { ...this.editingLine };
      this.recalculateTotals();
      // TODO: Save to backend via updateLineTop
      if (this.editingLine.id) {
        this.svc.updateLineTop(this.editingLine.id, this.editingLine).subscribe({
          error: () => console.error('Failed to update line')
        });
      }
    }
    this.editingLine = null;
  }

  cancelEditLineItem(): void {
    this.editingLine = null;
  }

  deleteLineItem(line: PayReportLine): void {
    if (!this.report) return;
    if (confirm('Are you sure you want to delete this line item?')) {
      this.report.lines = this.report.lines.filter(item => item.id !== line.id);
      this.recalculateTotals();
      // TODO: Delete from backend
      if (line.id) {
        this.svc.deleteLineTop(line.id).subscribe({
          error: () => console.error('Failed to delete line')
        });
      }
    }
  }

  private recalculateTotals(): void {
    if (!this.report) return;
    const sum = (k: keyof PayReportLine) => this.report.lines.reduce((s, l) => s + (Number(l[k]) || 0), 0);
    this.report.totalWeightOrHours = sum('weightOrHour');
    this.report.totalTruckPaid = sum('truckPaid');
    this.report.totalAmount = sum('total');
    this.report.totalDue = this.report.totalAmount
      + (this.report.fuelProgram ?? 0)
      + (this.report.fuelPilotOrKT ?? 0)
      + (this.report.fuelSurcharge ?? 0);
  }

  // ------- trackBy used in template -------
  trackByLineId = (index: number, line: PayReportLine) => line.id ?? index;

  // ------- sums / totals -------
  sum = (key: NumericLineKeys): number =>
    (this.report?.lines ?? []).reduce((s, l) => s + (Number(l[key]) || 0), 0);

  get totalDue(): number {
    const base = this.sum('total');
    const fuel =
      (this.report?.fuelProgram ?? 0) +
      (this.report?.fuelPilotOrKT ?? 0) +
      (this.report?.fuelSurcharge ?? 0);
    return base + fuel;
  }

  // ------- Export: PDF -------
  async exportPdf(): Promise<void> {
    if (!this.reportArea) return;
    const el = this.reportArea.nativeElement;

    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // scale image to page width
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let y = 0;
    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      // paginate
      let remaining = imgHeight;
      let canvasPos = 0;
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, -canvasPos, imgWidth, imgHeight, undefined, 'FAST');
        remaining -= pageHeight;
        canvasPos += pageHeight;
        if (remaining > 0) pdf.addPage();
      }
    }

    const filename = `pay-report-${this.report?.driverName || this.id}.pdf`;
    pdf.save(filename);
  }

  // ------- Export: CSV -------
  exportCsv(): void {
    if (!this.report) return;

    const header = [
      'Date',
      'Truck #',
      'Trailer #',
      'Job #',
      'Loaded',
      'Unload',
      'Weight/Hour',
      'Truck Paid',
      'Total',
      'Trailer Rent',
      'Broker Charge',
      'Contractor Paid'
    ];

    const rows = this.report.lines.map(l => [
      l.date,
      l.truckNumber,
      l.trailerNumber ?? '',
      l.jobNumber,
      quote(l.loaded),
      quote(l.unloaded),
      toNum(l.weightOrHour),
      toNum(l.truckPaid),
      toNum(l.total),
      toNum(l.trailerRent),
      toNum(l.brokerCharge),
      toNum(l.contractorPaid)
    ]);

    // footer rows
    rows.push([]);
    rows.push(['', '', '', '', '', 'Totals',
      toNum(this.sum('weightOrHour')),
      toNum(this.sum('truckPaid')),
      toNum(this.sum('total')),
      toNum(this.sum('trailerRent')),
      toNum(this.sum('brokerCharge')),
      toNum(this.sum('contractorPaid'))
    ]);

    rows.push(['', '', '', '', '', 'Fuel Program', '', '', '', '', '', toNum(this.report.fuelProgram)]);
    rows.push(['', '', '', '', '', 'Fuel - Pilot/KT', '', '', '', '', '', toNum(this.report.fuelPilotOrKT)]);
    rows.push(['', '', '', '', '', 'Fuel Surcharge', '', '', '', '', '', toNum(this.report.fuelSurcharge)]);
    rows.push(['', '', '', '', '', 'Total Due', '', '', '', '', '', toNum(this.totalDue)]);

    const csv = [header, ...rows]
      .map(cols => cols.map(safeCsv).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pay-report-${this.report.driverName || this.id}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);

    function toNum(v: any) { return v ?? 0; }
    function quote(v: any) { return v ?? ''; }
    function safeCsv(v: any) {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }
  }
}
