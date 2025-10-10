import { Component, OnInit, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface InvoiceDetail {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerAddress: string;
  companyName: string;
  companyAddress: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Void';
}

export interface InvoiceLineItem {
  id: number;
  date: string;
  truck: string;
  bolScaleTicket: string;
  description: string;
  weightTime: number;
  rate: number;
  amount: number;
}

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedModule],
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.scss']
})
export class InvoiceDetailComponent implements OnInit {
  @ViewChild('invoiceContent', { static: false }) invoiceContent!: ElementRef;
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  invoiceId: number | null = null;
  invoice: InvoiceDetail | null = null;
  isEditing = false;
  editingLineItem: InvoiceLineItem | null = null;

  // Mock data - replace with actual service call
  private mockInvoice: InvoiceDetail = {
    id: 1,
    invoiceNo: 'INV-000123',
    invoiceDate: '2025-09-02',
    dueDate: '2025-09-22',
    customerName: 'Rochester Sand & Gravel',
    customerAddress: '4105 East River Road NE, Rochester MN 55906',
    companyName: 'M Eaton Trucking LLC',
    companyAddress: '15790 320th Ave, Waseca, MN 56093',
    lineItems: [
      {
        id: 1,
        date: '2025-08-28',
        truck: 'Dump Truck I...',
        bolScaleTicket: '7 Jireh 7',
        description: '4952467-19 Dodge Center',
        weightTime: 10.5,
        rate: 114.00,
        amount: 1197.00
      },
      {
        id: 2,
        date: '2025-08-29',
        truck: 'Dump Truck I...',
        bolScaleTicket: '7 Jireh 7',
        description: '4952467-19 Dodge Center',
        weightTime: 6.5,
        rate: 114.00,
        amount: 741.00
      }
    ],
    subtotal: 1938.00,
    tax: 0,
    total: 1938.00,
    status: 'Sent'
  };

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.invoiceId = idParam ? +idParam : null;
    
    if (this.invoiceId) {
      this.loadInvoice(this.invoiceId);
    }
  }

  loadInvoice(id: number): void {
    // TODO: Replace with actual service call
    this.invoice = { ...this.mockInvoice, id };
  }

  goBack(): void {
    this.router.navigate(['/invoices-report']);
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  editLineItem(lineItem: InvoiceLineItem): void {
    this.editingLineItem = { ...lineItem };
  }

  saveLineItem(): void {
    if (!this.editingLineItem || !this.invoice) return;
    
    const index = this.invoice.lineItems.findIndex(item => item.id === this.editingLineItem!.id);
    if (index !== -1) {
      // Auto-calculate amount when weight/time or rate changes
      this.editingLineItem.amount = this.editingLineItem.weightTime * this.editingLineItem.rate;
      
      this.invoice.lineItems[index] = { ...this.editingLineItem };
      this.recalculateTotals();
    }
    
    this.editingLineItem = null;
    // TODO: Save to backend
  }

  cancelEditLineItem(): void {
    this.editingLineItem = null;
  }

  deleteLineItem(lineItem: InvoiceLineItem): void {
    if (!this.invoice) return;
    
    if (confirm('Are you sure you want to delete this line item?')) {
      this.invoice.lineItems = this.invoice.lineItems.filter(item => item.id !== lineItem.id);
      this.recalculateTotals();
      // TODO: Delete from backend
    }
  }

  addLineItem(): void {
    if (!this.invoice) return;
    
    const newLineItem: InvoiceLineItem = {
      id: Date.now(), // Temporary ID
      date: new Date().toISOString().split('T')[0],
      truck: '',
      bolScaleTicket: '',
      description: '',
      weightTime: 0,
      rate: 0,
      amount: 0
    };
    
    this.invoice.lineItems.push(newLineItem);
    this.editLineItem(newLineItem);
  }

  private recalculateTotals(): void {
    if (!this.invoice) return;
    
    this.invoice.subtotal = this.invoice.lineItems.reduce((sum, item) => sum + item.amount, 0);
    this.invoice.total = this.invoice.subtotal + this.invoice.tax;
  }

  exportPDF(): void {
    if (!this.invoice || !this.invoiceContent) return;
    
    // Hide buttons and actions for PDF export
    const buttons = this.invoiceContent.nativeElement.querySelectorAll('.btn, .d-flex.gap-2');
    buttons.forEach((btn: HTMLElement) => {
      btn.style.display = 'none';
    });

    html2canvas(this.invoiceContent.nativeElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    }).then(canvas => {
      // Restore buttons
      buttons.forEach((btn: HTMLElement) => {
        btn.style.display = '';
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Invoice-${this.invoice!.invoiceNo}.pdf`);
    }).catch(error => {
      console.error('Error generating PDF:', error);
      // Restore buttons in case of error
      buttons.forEach((btn: HTMLElement) => {
        btn.style.display = '';
      });
    });
  }

  exportCSV(): void {
    if (!this.invoice) return;
    
    const csvContent = this.generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Invoice-${this.invoice.invoiceNo}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private generateCSVContent(): string {
    if (!this.invoice) return '';
    
    const headers = ['Invoice No', 'Date', 'Due Date', 'Customer', 'Status', 'Date', 'Truck', 'BOL/Scale Ticket', 'Description', 'Weight/Time', 'Rate', 'Amount'];
    const rows: string[] = [];
    
    // Add invoice header row
    rows.push([
      this.invoice.invoiceNo,
      this.invoice.invoiceDate,
      this.invoice.dueDate,
      this.invoice.customerName,
      this.invoice.status,
      '', '', '', '', '', '', ''
    ].join(','));
    
    // Add line items
    this.invoice.lineItems.forEach(item => {
      rows.push([
        '', '', '', '', '',
        item.date,
        item.truck,
        item.bolScaleTicket,
        item.description,
        item.weightTime.toString(),
        item.rate.toString(),
        item.amount.toString()
      ].join(','));
    });
    
    // Add totals row
    rows.push([
      '', '', '', '', '', '', '', '', 'Total', '', '', this.invoice.total.toString()
    ].join(','));
    
    return [headers.join(','), ...rows].join('\n');
  }

  saveInvoice(): void {
    if (!this.invoice) return;
    
    // TODO: Save to backend
    console.log('Saving invoice:', this.invoice);
    this.isEditing = false;
  }

  trackByLineItemId(index: number, item: InvoiceLineItem): number {
    return item.id;
  }
}
