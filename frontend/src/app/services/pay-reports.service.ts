// src/app/services/pay-reports.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PayReport, PayReportLine } from 'src/app/models/pay-report.model';

export interface Driver {
  id: number;
  // keep optional; some APIs give first/last instead of a single name
  name?: string;
  first_name?: string;
  last_name?: string;
}

export interface JobLite {
  id: number;
  job_number: string;
  project: string;
  loading_address_info?: { location_name?: string; street_address?: string; city?: string };
  unloading_address_info?: { location_name?: string; street_address?: string; city?: string };
}

@Injectable({ providedIn: 'root' })
export class PayReportsService {
  constructor(private http: HttpClient) {}

  // ---- Pay report headers ----
  list(params?: { driver?: number; from?: string; to?: string }): Observable<PayReport[]> {
    let httpParams = new HttpParams();
    if (params?.driver != null) httpParams = httpParams.set('driver', String(params.driver));
    if (params?.from) httpParams = httpParams.set('from', params.from);
    if (params?.to) httpParams = httpParams.set('to', params.to);
    return this.http.get<PayReport[]>('/api/pay-reports/', { params: httpParams });
  }

  createReport(payload: {
    weekStart: string;
    weekEnd: string;
    driverId?: number;
    driverName?: string;
  }): Observable<PayReport> {
    return this.http.post<PayReport>('/api/pay-reports/', payload);
  }

  // some callers want the full response to read Location header
  createReportResponse(payload: {
    weekStart: string;
    weekEnd: string;
    driverName?: string;
  }): Observable<HttpResponse<PayReport>> {
    return this.http.post<PayReport>('/api/pay-reports/', payload, { observe: 'response' });
  }

  getReport(id: number): Observable<PayReport> {
    return this.http.get<PayReport>(`/api/pay-reports/${id}/`);
  }

  deleteReport(id: number): Observable<void> {
    return this.http.delete<void>(`/api/pay-reports/${id}/`);
  }

  // ---- Lines (top-level) ----
  listLines(reportId: number): Observable<PayReportLine[]> {
    const params = new HttpParams().set('report', String(reportId));
    return this.http.get<PayReportLine[]>('/api/pay-report-lines/', { params });
  }

  createLineTop(reportId: number, payload: Partial<PayReportLine>): Observable<PayReportLine> {
    return this.http.post<PayReportLine>('/api/pay-report-lines/', { report: reportId, ...payload });
  }

  updateLineTop(lineId: number, payload: Partial<PayReportLine>): Observable<PayReportLine> {
    return this.http.patch<PayReportLine>(`/api/pay-report-lines/${lineId}/`, payload);
  }

  deleteLineTop(lineId: number): Observable<void> {
    return this.http.delete<void>(`/api/pay-report-lines/${lineId}/`);
  }

  // ---- Drivers ----
  listDrivers(q?: string): Observable<Driver[]> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<Driver[]>('/api/drivers/', { params });
  }
}

@Injectable({ providedIn: 'root' })
export class JobsService {
  private base = '/api/jobs';
  constructor(private http: HttpClient) {}

  search(q: string): Observable<JobLite[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<JobLite[]>(this.base + '/', { params });
  }

  getByJobNumber(jobNumber: string): Observable<any> {
    return this.http.get(`${this.base}/by-number/${encodeURIComponent(jobNumber)}/`);
  }
}
