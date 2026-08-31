import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NoticeResponse {
  id: number;
  title: string;
  content: string;
  category: string;
  author: { id: number; name: string; email: string };
  createdAt: string;
  updatedAt?: string;
  isRead: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NoticesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/notices';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`
    });
  }

  getNotices(): Observable<NoticeResponse[]> {
    return this.http.get<NoticeResponse[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  markAsRead(id: string | number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/${id}/read`,
      {},
      { headers: this.getHeaders() }
    );
  }

  createNotice(dto: { title: string; content: string; category?: string }): Observable<NoticeResponse> {
    return this.http.post<NoticeResponse>(this.apiUrl, dto, {
      headers: this.getHeaders()
    });
  }

  deleteNotice(id: string | number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
}

