// src/app/pages/invoices/new-invoice-dialog/new-invoice-dialog.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface NewInvoiceResult {
  customerId: number;
  jobId: number;
  date: string; // YYYY-MM-DD
}

export interface DialogCustomer {
  id: number;
  name: string;
}

export interface DialogJob {
  id: number;
  customerId: number;
  jobNumber: string;
  projectName: string;
  performedOn?: string; // optional (if you want to suggest a date)
}

@Component({
  selector: 'app-new-invoice-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-invoice-dialog.component.html',
  styleUrls: ['./new-invoice-dialog.component.scss']
})
export class NewInvoiceDialogComponent {
  @Input({ required: true }) customers: DialogCustomer[] = [];
  @Input({ required: true }) jobs: DialogJob[] = [];

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<NewInvoiceResult>();

  // UI state
  customerQuery = '';
  jobQuery = '';
  selectedCustomerId: number | null = null;
  selectedJobId: number | null = null;
  date = this.today();

  // filter helpers
  filteredCustomers(): DialogCustomer[] {
    const q = this.customerQuery.trim().toLowerCase();
    return !q ? this.customers : this.customers.filter(c => c.name.toLowerCase().includes(q));
  }

  filteredJobs(): DialogJob[] {
    if (this.selectedCustomerId == null) return [];
    const q = this.jobQuery.trim().toLowerCase();
    return this.jobs
      .filter(j => j.customerId === this.selectedCustomerId)
      .filter(j =>
        !q ||
        j.jobNumber.toLowerCase().includes(q) ||
        j.projectName.toLowerCase().includes(q)
      );
  }

  onCustomerChange() {
    // reset job selection + query when customer changes
    this.selectedJobId = null;
    this.jobQuery = '';
  }

  canSave(): boolean {
    return this.selectedCustomerId != null && this.selectedJobId != null && !!this.date;
  }

  doSave() {
    if (!this.canSave() || this.selectedCustomerId == null || this.selectedJobId == null) return;
    this.save.emit({ customerId: this.selectedCustomerId, jobId: this.selectedJobId, date: this.date });
  }

  today(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
}
