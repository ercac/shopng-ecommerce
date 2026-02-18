// ============================================================
// APP CONFIG — Application-wide providers and configuration
// ============================================================
// ANGULAR CONCEPT: ApplicationConfig
//
// In standalone Angular apps (no NgModules), this is where you
// register application-wide providers. Common providers:
// - provideRouter()     → Enables routing (URL navigation)
// - provideHttpClient() → Enables HTTP calls to backend APIs
// - withInterceptors()  → Registers HTTP interceptors
//
// NEW: withInterceptors() wraps our authInterceptor so it runs
// on EVERY HTTP request. This automatically adds the JWT token
// to all API calls without repeating code in every service.
// ============================================================

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // provideHttpClient() sets up Angular's HttpClient.
    // withInterceptors() registers our auth interceptor so that
    // every HTTP request automatically includes the JWT token.
    // You can pass multiple interceptors: withInterceptors([a, b, c])
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
