// ============================================================
// ENVIRONMENT CONFIG — API URL and app-wide settings
// ============================================================
// ANGULAR CONCEPT: Environment Configuration
//
// This file defines values that change between development
// and production. In dev, the API runs on localhost:3000.
// In production, it would be your real domain.
//
// Usage in services:
//   import { environment } from '../environments/environment';
//   this.http.get(`${environment.apiUrl}/products`);
// ============================================================

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
