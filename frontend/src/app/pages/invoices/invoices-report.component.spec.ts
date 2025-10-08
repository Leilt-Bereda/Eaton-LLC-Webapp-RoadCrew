// src/app/pages/invoices/invoices.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { InvoicesReportComponent } from './invoices-report.component';

describe('InvoicesReportComponent', () => {
  let component: InvoicesReportComponent;
  let fixture: ComponentFixture<InvoicesReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, InvoicesReportComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicesReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
