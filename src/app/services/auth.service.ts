import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User, AuthResponse } from '../product.model';
import { environment } from '../environments/environment';
import { LOCAL_ACCOUNTS } from '../credentials.local';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  private currentUserSignal = signal<User | null>(null);
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUserSignal() !== null);
  readonly isAdmin = computed(() => {
    const user = this.currentUserSignal();
    return user !== null && user.role === 'admin';
  });

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromToken();
  }

  // ── Login ───────────────────────────────────────────────────
  // Checks local credentials (from credentials.local.ts) first.
  // If no match, falls through to the real backend API.
  async login(email: string, password: string): Promise<User> {
    // Check local accounts first (git-ignored file)
    const fakeMatch = LOCAL_ACCOUNTS.find(
      a => a.email === email && a.password === password
    );

    if (fakeMatch) {
      // Store a dev token that encodes which fake account it is.
      // Format: "dev-fake-<email>" so loadUserFromToken can restore it.
      localStorage.setItem('token', `dev-fake-${fakeMatch.email}`);
      this.currentUserSignal.set(fakeMatch.user);
      return fakeMatch.user;
    }

    // No fake match — hit the real backend
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
        email,
        password
      })
    );

    localStorage.setItem('token', response.token);
    this.currentUserSignal.set(response.user);
    return response.user;
  }

  // ── Register ────────────────────────────────────────────────
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data)
    );

    localStorage.setItem('token', response.token);
    this.currentUserSignal.set(response.user);
    return response.user;
  }

  // ── Logout ──────────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }

  // ── Get Token ───────────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // ── Load User from Token ────────────────────────────────────
  // On app startup, restores the session. If the token is a
  // dev-fake token, restores the fake user without an API call.
  // Otherwise hits GET /auth/me to validate the real JWT.
  private async loadUserFromToken(): Promise<void> {
    const token = this.getToken();
    if (!token) return;

    // Check if it's a dev-fake token
    if (token.startsWith('dev-fake-')) {
      const email = token.replace('dev-fake-', '');
      const fakeMatch = LOCAL_ACCOUNTS.find(a => a.email === email);
      if (fakeMatch) {
        this.currentUserSignal.set(fakeMatch.user);
        return;
      }
      // Invalid fake token — clean up
      localStorage.removeItem('token');
      return;
    }

    // Real token — validate with backend
    try {
      const user = await firstValueFrom(
        this.http.get<User>(`${this.apiUrl}/auth/me`)
      );
      this.currentUserSignal.set(user);
    } catch {
      localStorage.removeItem('token');
      this.currentUserSignal.set(null);
    }
  }
}
