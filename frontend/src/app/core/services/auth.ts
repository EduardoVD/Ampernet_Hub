import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
  private router = inject(Router);
  private apiUrl = 'http://localhost:3000/auth/login';

  private expirationTimer: any = null;

  currentUser = signal<UserPayload | null>(this.getStoredUser());
  isAuthenticated = signal<boolean>(!this.isTokenExpired());

  constructor() {
    this.setupAutoLogout();
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, credentials).pipe(
      tap((res) => {
        if (res.accessToken) {
          localStorage.setItem('token', res.accessToken);
          this.isAuthenticated.set(true);
          this.setupAutoLogout();
        }
        if (res.user) {
          localStorage.setItem('user_data', JSON.stringify(res.user));
          this.currentUser.set(res.user);
        }
      })
    );
  }

  logout(redirect: boolean = true): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);

    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }

    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isTokenExpired(token?: string | null): boolean {
    const t = token || this.getToken();
    if (!t) return true;

    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      if (!payload.exp) return false;

      const isExpired = Date.now() >= payload.exp * 1000;
      if (isExpired) {
        this.logout(false);
      }
      return isExpired;
    } catch {
      return true;
    }
  }

  private setupAutoLogout(): void {
    const token = this.getToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return;

      const timeLeft = payload.exp * 1000 - Date.now();

      if (timeLeft <= 0) {
        this.logout();
      } else {
        if (this.expirationTimer) {
          clearTimeout(this.expirationTimer);
        }

        this.expirationTimer = setTimeout(() => {
          alert('Sua sessão expirou. Por favor, faça Login novamente.');
          this.logout();
        }, timeLeft);
      }
    } catch {
      this.logout();
    }
  }

  private getStoredUser(): UserPayload | null {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }
}