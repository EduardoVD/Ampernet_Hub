import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IssueHistoryItem {
  id: number;
  title: string;
  description: string;
  status: 'ongoing' | 'resolved';
  startedAt: string;
  resolvedAt?: string | null;
  durationMinutes: number | null;
  durationFormatted: string;
  isDeleted: boolean;
  deletedAt?: string | null;
  author?: { id: number; name: string; email: string } | null;
  createdAt: string;
}

export interface IssueHistoryStats {
  total: number;
  resolved: number;
  ongoing: number;
  resolutionRate: number;
  avgResolutionTimeMinutes: number;
  avgResolutionTimeFormatted: string;
  longestResolutionMinutes: number;
  longestResolutionFormatted: string;
}

export interface IssueHistoryReport {
  items: IssueHistoryItem[];
  stats: IssueHistoryStats | null;
}

export interface NoticeHistoryItem {
  id: number;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  deletedAt?: string | null;
  author?: { id: number; name: string; email: string } | null;
  readCount: number;
  totalUsers: number;
  readPercentage: number;
}

export interface NoticeHistoryStats {
  totalNotices: number;
  totalActiveUsers: number;
  totalReads: number;
  avgReadPercentage: number;
  categoriesBreakdown: Array<{ category: string; count: number }>;
}

export interface NoticeHistoryReport {
  items: NoticeHistoryItem[];
  stats: NoticeHistoryStats | null;
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reports`;

  getIssuesReport(filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
    search?: string;
    includeDeleted?: boolean;
  }): Observable<IssueHistoryReport> {
    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.status && filters.status !== 'all') params = params.set('status', filters.status);
    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters.includeDeleted) params = params.set('includeDeleted', 'true');

    return this.http.get<IssueHistoryReport>(`${this.apiUrl}/issues`, { params });
  }

  getNoticesReport(filters: {
    startDate?: string;
    endDate?: string;
    category?: string;
    search?: string;
    includeDeleted?: boolean;
  }): Observable<NoticeHistoryReport> {
    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.category && filters.category !== 'all') params = params.set('category', filters.category);
    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters.includeDeleted) params = params.set('includeDeleted', 'true');

    return this.http.get<NoticeHistoryReport>(`${this.apiUrl}/notices`, { params });
  }

  /**
   * Exporta conjunto de dados para CSV com suporte nativo a acentuação (BOM UTF-8)
   */
  exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
    const escapeCell = (val: string | number) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerLine = headers.map(escapeCell).join(';');
    const rowLines = rows.map((r) => r.map(escapeCell).join(';'));
    const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
