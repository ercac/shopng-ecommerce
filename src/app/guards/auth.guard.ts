// ============================================================
// AUTH GUARD — Protects routes that require login
// ============================================================
// ANGULAR CONCEPT: Route Guards (Functional Style)
//
// Guards control whether a user can access a route. When you
// add `canActivate: [authGuard]` to a route definition,
// Angular calls this function BEFORE navigating.
//
// If it returns `true`, navigation proceeds.
// If it returns a UrlTree, Angular redirects to that URL.
//
// Angular 17 favors FUNCTIONAL guards over class-based guards.
// inject() lets us access services inside the function.
//
// Usage in routes:
//   { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] }
// ============================================================

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  // inject() is Angular's way of getting a service inside
  // a function (outside of a class constructor).
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if the user is logged in via the signal
  if (authService.isLoggedIn()) {
    // User is authenticated — allow navigation
    return true;
  }

  // Not logged in — redirect to the login page.
  // router.createUrlTree() creates a navigation instruction
  // that Angular will follow instead of the original route.
  //
  // queryParams: { returnUrl: state.url } saves where the user
  // was trying to go, so we can redirect them back after login.
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
