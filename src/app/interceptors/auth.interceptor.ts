// ============================================================
// AUTH INTERCEPTOR — Automatically attaches JWT to HTTP requests
// ============================================================
// ANGULAR CONCEPT: HTTP Interceptors (Functional Style)
//
// Interceptors sit between your app and the network. Every HTTP
// request passes through them before being sent. This is the
// perfect place to attach the JWT Authorization header.
//
// Angular 17 uses FUNCTIONAL interceptors (not class-based).
// It's just a function with the signature:
//   (req: HttpRequest, next: HttpHandlerFn) => Observable<HttpEvent>
//
// How it works:
//   1. Your service calls http.get('/api/products')
//   2. This interceptor catches the request
//   3. It clones the request and adds the Authorization header
//   4. It passes the modified request to the next handler
//   5. The request reaches the server with the JWT token
//
// Why clone? HttpRequest objects are IMMUTABLE in Angular.
// You can't modify them directly — you must create a new one.
// ============================================================

import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Retrieve the JWT token from localStorage
  const token = localStorage.getItem('token');

  // If we have a token, clone the request and add the header
  if (token) {
    // req.clone() creates a new request with modified properties
    // We set the Authorization header using the "Bearer" scheme,
    // which is the standard for JWT authentication.
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    // Pass the modified request to the next handler in the chain
    return next(authReq);
  }

  // No token — pass the original request unchanged
  return next(req);
};
