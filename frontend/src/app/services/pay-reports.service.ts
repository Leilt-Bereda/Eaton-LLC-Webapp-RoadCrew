// src/app/pages/pay-reports/pay-reports.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PayReport, PayReportLine } from 'src/app/models/pay-report.model';
export interface JobLite {
  id: number;
  job_number: string;
  project: string;
  loading_address_info?: { location_name?: string; street_address?: string; city?: string };
  unloading_address_info?: { location_name?: string; street_address?: string; city?: string };
  // add any fields you want to display in the dropdown
}

@Injectable({ providedIn: 'root' })
export class PayReportsService {
  constructor(private http: HttpClient) {}

  list(params?: { driver?: number; from?: string; to?: string; }): Observable<PayReport[]> {
    let httpParams = new HttpParams();
    if (params?.driver != null) httpParams = httpParams.set('driver', String(params.driver));
    if (params?.from) httpParams = httpParams.set('from', params.from);
    if (params?.to) httpParams = httpParams.set('to', params.to);
    return this.http.get<PayReport[]>('/api/pay-reports', { params: httpParams });
  }

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

  deleteReport(id: number): Observable<void> {
    return this.http.delete<void>(`/api/pay-reports/${id}`);
  }

  // Top-level pay-report-lines
  listLines(reportId: number): Observable<PayReportLine[]> {
    const params = new HttpParams().set('report', String(reportId));
    return this.http.get<PayReportLine[]>(`/api/pay-report-lines`, { params });
  }

  createLineTop(reportId: number, payload: Partial<PayReportLine>): Observable<PayReportLine> {
    return this.http.post<PayReportLine>(`/api/pay-report-lines`, { report: reportId, ...payload });
  }

  updateLineTop(lineId: number, payload: Partial<PayReportLine>): Observable<PayReportLine> {
    return this.http.patch<PayReportLine>(`/api/pay-report-lines/${lineId}`, payload);
  }

  deleteLineTop(lineId: number): Observable<void> {
    return this.http.delete<void>(`/api/pay-report-lines/${lineId}`);
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
  private base = '/api/jobs';

  constructor(private http: HttpClient) {}

  search(q: string): Observable<JobLite[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<JobLite[]>(this.base, { params });
  }

  getByJobNumber(jobNumber: string): Observable<any> {
    return this.http.get(`/api/jobs/by-number/${encodeURIComponent(jobNumber)}`);
  }
}
