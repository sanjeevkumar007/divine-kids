import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Register } from '../models/register';
import { BehaviorSubject, tap } from 'rxjs';
import { AuthResponse } from '../models/AuthResponse';
import { Router } from '@angular/router';
import { User } from '../models/accounts/User';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  router: Router = inject(Router);
  private apiBaseUrl = environment.apiUrl;
  private tokenKey = 'dk_auth_token';
  registerData: Register | null = null;
  currentUser = signal<User | null>(null);

  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem(this.tokenKey));
  token$ = this.tokenSubject.asObservable();


  get token(): string | null {
    return localStorage.getItem('dk_auth_token');
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  login(data: { email: string; password: string }) {
    return this.http.post<User>(this.apiBaseUrl + '/auth/login', data).pipe(
      tap(user => {
        console.log('[AuthService] login response:', user);
        if (user) {
          this.currentUser.set(user);
          const tk = (user as any)?.token || (user as any)?.accessToken || (user as any)?.jwt || (user as any)?.data?.token;
          if (tk) this.storeToken(tk);
        }
      })
    );
  }

  register(data: Register) {
    return this.http.post<any>(this.apiBaseUrl + '/auth/register', data).pipe(
      tap(res => {
        const tk = res?.token || res?.accessToken || res?.jwt || res?.data?.token;
        console.log('register response', res, 'picked token:', tk);
        if (tk) this.storeToken(tk);
      })
    );
  }

  // Decode JWT payload (no external lib)
  private decode(token: string): any | null {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return null;
    }
  }

  isTokenExpired(): boolean {
    const t = this.token;
    if (!t) return true;
    const parts = t.split('.');
    if (parts.length !== 3) return false; // not a JWT → assume not expired
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.exp) return false;
      return payload.exp < Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  }

  validateOrLogout(): boolean {
    if (!this.token || this.isTokenExpired()) {
      this.logout();
      return false;
    }
    return true;
  }

  logout() {
    this.storeToken(null);
    // optional: navigate to auth
    this.router.navigate(['/auth']);
  }

  private storeToken(raw?: string | null) {
    if (raw) {
      console.log('[AuthService] storing token length:', raw.length);
      localStorage.setItem(this.tokenKey, raw);
      this.tokenSubject.next(raw);
    } else {
      console.log('[AuthService] clearing token');
      localStorage.removeItem(this.tokenKey);
      this.tokenSubject.next(null);
    }
  }
}
