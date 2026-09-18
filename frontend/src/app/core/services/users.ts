import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserItem {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'supervisor' | 'user';
  isActive?: boolean;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'supervisor' | 'user';
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  getUsers(): Observable<UserItem[]> {
    return this.http.get<UserItem[]>(this.apiUrl);
  }

  getUser(id: number): Observable<UserItem> {
    return this.http.get<UserItem>(`${this.apiUrl}/${id}`);
  }

  createUser(dto: CreateUserDto): Observable<UserItem> {
    return this.http.post<UserItem>(this.apiUrl, dto);
  }

  updateUser(id: number, dto: UpdateUserDto): Observable<UserItem> {
    return this.http.patch<UserItem>(`${this.apiUrl}/${id}`, dto);
  }

  deleteUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}

