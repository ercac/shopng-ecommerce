// ============================================================
// ADMIN GUARD — Protects admin-only routes
// ============================================================
// ANGULAR CONCEPT: Layered Route Guards
//
// You can stack multiple guards on a route. For admin pages,
// we use BOTH the authGuard (must be logged in) and adminGuard
// (must have admin role).
//
// In the routes config:
//   {
//     path: 'admin',
//     canActivate: [authGuard, adminGuard],
//     ...
//   }
//
// Angular runs guards in order. If authGuard fails (not logged in),
// adminGuard never runs. This keeps our logic clean and separated.
// ============================================================

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check the computed isAdmin signal
  if (authService.isAdmin()) {
    return true;
  }

  // Not an admin — redirect to home page.
  // We don't redirect to /login because the authGuard
  // already handles that. If we get here, the user IS
  // logged in but just doesn't have admin privileges.
  return router.createUrlTree(['/']);
};
