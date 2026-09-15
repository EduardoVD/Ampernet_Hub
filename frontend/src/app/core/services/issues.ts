import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IssueItem {
  id: number;
  title: string;
  description: string;
  status: 'ongoing' | 'resolved';
  startedAt: string;
  resolvedAt?: string | null;
  formattedStarted?: string;
  formattedResolved?: string;
  durationText?: string;
  author?: { id: number; name: string; email: string } | null;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class IssuesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/issues`;

  getIssues(status?: string): Observable<IssueItem[]> {
    const url = status ? `${this.apiUrl}?status=${status}` : this.apiUrl;
    return this.http.get<any[]>(url).pipe(
      map((items) => items.map((item) => this.formatIssue(item)))
    );
  }

  getIssue(id: number): Observable<IssueItem> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((item) => this.formatIssue(item))
    );
  }

  createIssue(dto: {
    title: string;
    description: string;
    status?: 'ongoing' | 'resolved';
    startedAt?: string;
  }): Observable<IssueItem> {
    return this.http.post<any>(this.apiUrl, dto).pipe(
      map((item) => this.formatIssue(item))
    );
  }

  updateIssue(
    id: number,
    dto: {
      title?: string;
      description?: string;
      status?: 'ongoing' | 'resolved';
      startedAt?: string;
      resolvedAt?: string | null;
    }
  ): Observable<IssueItem> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, dto).pipe(
      map((item) => this.formatIssue(item))
    );
  }

  resolveIssue(id: number): Observable<IssueItem> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/resolve`, {}).pipe(
      map((item) => this.formatIssue(item))
    );
  }

  deleteIssue(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  private formatIssue(item: any): IssueItem {
    let formattedStarted = '';
    if (item.startedAt) {
      const d = new Date(item.startedAt);
      formattedStarted = `${d.toLocaleDateString('pt-BR')} · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    let formattedResolved: string | undefined = undefined;
    let durationText: string | undefined = undefined;

    if (item.status === 'resolved' && item.resolvedAt) {
      const dRes = new Date(item.resolvedAt);
      formattedResolved = `${dRes.toLocaleDateString('pt-BR')} · ${dRes.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

      if (item.startedAt) {
        const diffMs = dRes.getTime() - new Date(item.startedAt).getTime();
        const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours > 0) {
          durationText = `${hours}h ${minutes}min · Tempo Total`;
        } else {
          durationText = `${minutes}min · Tempo Total`;
        }
      }
    }

    return {
      ...item,
      formattedStarted,
      formattedResolved,
      durationText,
    };
  }
}
