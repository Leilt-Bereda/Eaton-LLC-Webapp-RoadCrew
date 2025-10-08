import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
// TODO: Update the path below if your model file is located elsewhere
import { InvoiceHeader } from './invoices-report.model';
import { NewInvoiceDialogComponent, NewInvoiceResult } from './new-invoice-dialog/new-invoice-dialog.component';
imports: [CommonModule, FormsModule, RouterModule, SharedModule, NewInvoiceDialogComponent]

type InvoiceRow = InvoiceHeader & { selected?: boolean };

@Component({
  selector: 'app-invoices-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, NewInvoiceDialogComponent],
  templateUrl: './invoices-report.component.html',
  styleUrls: ['./invoices-report.component.scss']
})
export class InvoicesReportComponent implements OnInit {
  // top-right actions state
  selected: InvoiceRow[] = [];
  showNewModal = false;

  customers = [
    { id: 1, name: 'Northland Construction' },
    { id: 2, name: 'Metro Logistics' },
    { id: 3, name: 'River City Builders' }
  ];
  jobs = [
    { id: 11, customerId: 1, jobNumber: 'JOB-1001', projectName: 'Bridge Repair', performedOn: '2025-09-28' },
    { id: 12, customerId: 1, jobNumber: 'JOB-1007', projectName: 'Site Prep',     performedOn: '2025-10-01' },
    { id: 21, customerId: 2, jobNumber: 'JOB-2002', projectName: 'Downtown Haul', performedOn: '2025-09-30' },
    { id: 22, customerId: 2, jobNumber: 'JOB-2008', projectName: 'Asphalt Move',  performedOn: '2025-10-03' }
  ];
  navigateToCreateInvoice() { this.showNewModal = true; }
  onCloseNew() { this.showNewModal = false; }
// handle save from dialog
  onSaveNew(result: NewInvoiceResult): void {
  this.showNewModal = false;

  // Optional: optimistic add so you see it immediately
  const customerName = this.customers.find(c => c.id === result.customerId)?.name ?? 'Customer';
  const nextId = Math.max(0, ...this.invoices.map(i => i.id)) + 1;

  this.invoices.unshift({
    id: nextId,
    invoiceNo: 'INV-' + Math.floor(100000 + Math.random() * 900000),
    projectName: `From job ${result.jobId}`,
    customerName,
    invoiceDate: result.date,
    status: 'Draft',
    totalAmount: 0,
    selected: false
  } as InvoiceRow);
} 
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



  open(id: number): void {
    // this.router.navigate(['/invoices', id]);
    console.log('open invoice', id);
  }

  edit(id: number): void {
  // Option A: navigate to an edit page (recommended)
  // this.router.navigate(['/invoices', id, 'edit']);

  // Option B: for now just open your existing “open” page and edit there
  console.log('edit invoice', id);
}

  delete(id: number): void {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    this.all = this.all.filter(i => i.id !== id);
    this.applyFilters();
    console.log('deleted invoice', id);
  }


  generateSelected(): void {
    // e.g., bulk generate PDFs / send
    console.log('generate on', this.selected.map(s => s.id));
  }
}
