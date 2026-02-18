// ============================================================
// AUTH SERVICE — Manages authentication state & API calls
// ============================================================
// ANGULAR CONCEPTS:
//
// 1. Signals for reactive state — We store the current user
//    in a signal so the UI (navbar, guards) automatically
//    reacts when the user logs in or out.
//
// 2. computed() — Derived values from signals. `isAdmin` is
//    computed from `currentUser`, so it updates automatically.
//
// 3. HttpClient — Angular's built-in HTTP client for making
//    API requests. Returns Observables, but we convert to
//    Promises here using firstValueFrom() for simpler async/await.
//
// 4. localStorage — Browser storage that persists across page
//    reloads. We store the JWT token here so the user stays
//    logged in even after refreshing the page.
// ============================================================

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User, AuthResponse } from '../product.model';
import { environment } from '../environments/environment';

@Injectable({
  // providedIn: 'root' makes this a singleton — one instance
  // shared across the entire app. Perfect for auth state.
  providedIn: 'root'
})
export class AuthService {
  // ── API base URL ──────────────────────────────────────────
  private apiUrl = environment.apiUrl;

  // ── Reactive State with Signals ───────────────────────────
  // signal<T | null> creates a reactive container.
  // When we call currentUser.set(user), any component reading
  // currentUser() in its template will automatically re-render.
  private currentUserSignal = signal<User | null>(null);

  // Public read-only access to the current user signal
  readonly currentUser = this.currentUserSignal.asReadonly();

  // computed() derives a value from other signals.
  // isLoggedIn automatically becomes true when currentUser is set.
  readonly isLoggedIn = computed(() => this.currentUserSignal() !== null);

  // isAdmin checks both that we're logged in AND the user has admin role
  readonly isAdmin = computed(() => {
    const user = this.currentUserSignal();
    return user !== null && user.role === 'admin';
  });

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // On app startup, check if there's a saved token.
    // This restores the user's session after a page refresh.
    this.loadUserFromToken();
  }

  // ── Login ─────────────────────────────────────────────────
  // Sends email/password to the API, stores the JWT token,
  // and updates the currentUser signal.
  async login(email: string, password: string): Promise<User> {
    // firstValueFrom converts an Observable to a Promise.
    // This lets us use async/await instead of .subscribe()
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
        email,
        password
      })
    );

    // Store the JWT token in localStorage for persistence
    localStorage.setItem('token', response.token);

    // Update the signal — this triggers re-renders everywhere
    // that reads currentUser(), isLoggedIn(), or isAdmin()
    this.currentUserSignal.set(response.user);

    return response.user;
  }

  // ── Register ──────────────────────────────────────────────
  // Creates a new user account, stores the token, and logs in.
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

  // ── Logout ────────────────────────────────────────────────
  // Clears the token and resets the user signal.
  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }

  // ── Get Token ─────────────────────────────────────────────
  // Used by the auth interceptor to attach the token to requests.
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // ── Load User from Token ──────────────────────────────────
  // Called on app startup. If a token exists, we call GET /auth/me
  // to get the user's info. If the token is expired or invalid,
  // we clear it silently.
  private async loadUserFromToken(): Promise<void> {
    const token = this.getToken();
    if (!token) return;

    try {
      // Call the /auth/me endpoint to validate the token
      // and get the current user's info
      const user = await firstValueFrom(
        this.http.get<User>(`${this.apiUrl}/auth/me`)
      );
      this.currentUserSignal.set(user);
    } catch {
      // Token is expired or invalid — clean up silently
      localStorage.removeItem('token');
      this.currentUserSignal.set(null);
    }
  }
}
