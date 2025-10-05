import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
// TODO: Update the path below if your model file is located elsewhere
import { InvoiceHeader } from './invoices-report.model';

type InvoiceRow = InvoiceHeader & { selected?: boolean };

@Component({
  selector: 'app-invoices-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedModule],
  templateUrl: './invoices-report.component.html',
  styleUrls: ['./invoices-report.component.scss']
})
export class InvoicesReportComponent implements OnInit {
  // top-right actions state
  selected: InvoiceRow[] = [];

  // filters
  filters = {
    customer: '',
    project: '',
    status: '' as '' | InvoiceHeader['status'],
    date: '' as '' | 'invoiceDate',  // future use
  };

  // backing store (replace with API later)
  private all: InvoiceRow[] = [
    {
      id: 1,
      invoiceNo: 'INV-000123',
      projectName: 'Bridge Repair',
      customerName: 'Northland Construction',
      invoiceDate: '2025-09-28',
      status: 'Draft',
      totalAmount: 4280.5
    },
    {
      id: 2,
      invoiceNo: 'INV-000124',
      projectName: 'Downtown Haul',
      customerName: 'Metro Logistics',
      invoiceDate: '2025-09-30',
      status: 'Sent',
      totalAmount: 7120
    },
    {
      id: 3,
      invoiceNo: 'INV-000119',
      projectName: 'Site Prep',
      customerName: 'Northland Construction',
      invoiceDate: '2025-08-31',
      status: 'Paid',
      totalAmount: 2100
    }
  ];

  // table data
  invoices: InvoiceRow[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.invoices = [...this.all];
  }

  trackById = (_: number, r: InvoiceRow) => r.id;

  onSelect(): void {
    this.selected = this.invoices.filter(r => !!r.selected);
  }

  applyFilters(): void {
  const c = this.filters.customer.toLowerCase();
  const p = this.filters.project.toLowerCase();
  const s = this.filters.status;
  const d = this.filters.date;

  this.invoices = this.all.filter(r => {
    const mC = c ? r.customerName.toLowerCase().includes(c) : true;
    const mP = p ? r.projectName.toLowerCase().includes(p) : true;
    const mS = s ? r.status === s : true;
    const mD = d ? r.invoiceDate === d : true; // exact date match
    return mC && mP && mS && mD;
  });

  this.onSelect();
}


  navigateToCreateInvoice(): void {
    // this.router.navigate(['/invoices/new']);
    console.log('navigateToCreateInvoice');
  }

  open(id: number): void {
    // this.router.navigate(['/invoices', id]);
    console.log('open invoice', id);
  }

  generateSelected(): void {
    // e.g., bulk generate PDFs / send
    console.log('generate on', this.selected.map(s => s.id));
  }
}
