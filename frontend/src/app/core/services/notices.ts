import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NoticeResponse {
  id: number;
  title: string;
  content: string;
  category: string;
  author?: { id: number; name: string; email: string } | null;
  createdAt: string;
  updatedAt?: string;
  isRead: boolean;
  readAt?: string | null;
}

export interface NoticeReader {
  id: number;
  name: string;
  email: string;
  readAt?: string;
}

export interface NoticeReadStatusResponse {
  noticeId: number;
  noticeTitle: string;
  totalUsers: number;
  readCount: number;
  pendingCount: number;
  percentage: number;
  readers: NoticeReader[];
  pending: NoticeReader[];
}

@Injectable({
  providedIn: 'root'
})
export class NoticesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notices`;

  getNotices(): Observable<NoticeResponse[]> {
    return this.http.get<NoticeResponse[]>(this.apiUrl);
  }

  markAsRead(id: string | number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/read`, {});
  }

  createNotice(dto: { title: string; content: string; category?: string }): Observable<NoticeResponse> {
    return this.http.post<NoticeResponse>(this.apiUrl, dto);
  }

  updateNotice(id: string | number, dto: { title: string; content: string; category?: string }): Observable<NoticeResponse> {
    return this.http.patch<NoticeResponse>(`${this.apiUrl}/${id}`, dto);
  }

  deleteNotice(id: string | number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  getReadStatus(noticeId: string | number): Observable<NoticeReadStatusResponse> {
    return this.http.get<NoticeReadStatusResponse>(`${this.apiUrl}/${noticeId}/read-status`);
  }
}

