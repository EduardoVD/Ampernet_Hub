import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ResponsibilityItem {
  id: number;
  sector: string;
  city: string;
  responsible: string;
  ramal?: string | null;
  email?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ResponsibilitiesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/responsibilities`;

  getResponsibilities(city?: string, sector?: string): Observable<ResponsibilityItem[]> {
    let params = new HttpParams();
    if (city) {
      params = params.set('city', city);
    }
    if (sector) {
      params = params.set('sector', sector);
    }
    return this.http.get<ResponsibilityItem[]>(this.apiUrl, { params });
  }

  getResponsibility(id: number): Observable<ResponsibilityItem> {
    return this.http.get<ResponsibilityItem>(`${this.apiUrl}/${id}`);
  }

  createResponsibility(dto: {
    sector: string;
    city: string;
    responsible: string;
    ramal?: string;
    email?: string;
  }): Observable<ResponsibilityItem> {
    return this.http.post<ResponsibilityItem>(this.apiUrl, dto);
  }

  updateResponsibility(
    id: number,
    dto: {
      sector?: string;
      city?: string;
      responsible?: string;
      ramal?: string | null;
      email?: string | null;
    }
  ): Observable<ResponsibilityItem> {
    return this.http.patch<ResponsibilityItem>(`${this.apiUrl}/${id}`, dto);
  }

  deleteResponsibility(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
