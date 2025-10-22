// src/app/pages/pay-reports/pay-reports.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PayReport, PayReportLine } from 'src/app/models/pay-report.model';

@Injectable({ providedIn: 'root' })
export class PayReportsService {
  constructor(private http: HttpClient) {}

  createReport(payload: {
    weekStart: string;   // "YYYY-MM-DD"
    weekEnd: string;     // "YYYY-MM-DD"
    driverId?: number;   // optional if you key by driver
    driverName?: string; // if you store name on header
  }): Observable<PayReport> {
    return this.http.post<PayReport>('/api/pay-reports', payload);
  }
  createReportResponse(
    payload: { weekStart: string; weekEnd: string; driverName?: string; }
  ): Observable<HttpResponse<PayReport>> {
    return this.http.post<PayReport>('/api/pay-reports', payload, { observe: 'response' });
  }
  

  getReport(id: number): Observable<PayReport> {
    return this.http.get<PayReport>(`/api/pay-reports/${id}`);
  }

  createLine(reportId: number, payload: Partial<PayReportLine> & {
    date: string; driverName: string; jobNumber: string;
    truckNumber: string; trailerNumber?: string;
  }): Observable<PayReportLine> {
    return this.http.post<PayReportLine>(`/api/pay-reports/${reportId}/lines`, payload);
  }
}

// Optional: separate file for Jobs to keep concerns clean
@Injectable({ providedIn: 'root' })
export class JobsService {
  constructor(private http: HttpClient) {}
  getByJobNumber(jobNumber: string): Observable<any> {
    return this.http.get(`/api/jobs/${encodeURIComponent(jobNumber)}`);
  }
}
