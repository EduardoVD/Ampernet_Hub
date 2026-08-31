import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface UserPayload {
  id: number | string;
  name: string;
  email: string;
  role?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserPayload;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/auth/login';

  currentUser = signal<UserPayload | null>(this.getStoredUser());
  isAuthenticated = signal<boolean>(!!this.getToken());

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, credentials).pipe(
      tap((res) => {
        if (res.accessToken) {
          localStorage.setItem('token', res.accessToken);
          this.isAuthenticated.set(true);
        }
        if (res.user) {
          localStorage.setItem('user_data', JSON.stringify(res.user));
          this.currentUser.set(res.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getStoredUser(): UserPayload | null {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }
}