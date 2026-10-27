import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SectorItem {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SectorCollaborator {
  id: number;
  responsible: string;
  email?: string | null;
}

export interface SectorWithCollaboratorsItem {
  id: number;
  name: string;
  collaboratorsCount: number;
  collaborators: SectorCollaborator[];
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SectorsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sectors`;

  getSectors(): Observable<SectorItem[]> {
    return this.http.get<SectorItem[]>(this.apiUrl);
  }

  getSectorsWithCollaborators(): Observable<SectorWithCollaboratorsItem[]> {
    return this.http.get<SectorWithCollaboratorsItem[]>(`${this.apiUrl}/with-collaborators`);
  }

  getSector(id: number): Observable<SectorItem> {
    return this.http.get<SectorItem>(`${this.apiUrl}/${id}`);
  }

  createSector(name: string): Observable<SectorItem> {
    return this.http.post<SectorItem>(this.apiUrl, { name });
  }

  deleteSector(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}

