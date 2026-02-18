// ============================================================
// ADMIN MIDDLEWARE — Ensure the user has admin role
// ============================================================
// CONCEPT: Authorization vs Authentication
//
// Authentication = "Who are you?" (handled by auth.js)
// Authorization  = "What are you allowed to do?" (this file)
//
// This middleware MUST be used AFTER auth middleware:
//   router.delete('/products/:id', auth, admin, handler);
//                                  ^^^^  ^^^^^
//                                  1st   2nd
//
// auth.js verifies the token and sets req.user
// admin.js checks if req.user.role === 'admin'
// ============================================================

function admin(req, res, next) {
  // req.user is set by the auth middleware
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied. Admin privileges required.'
    });
  }

  next();  // User is admin, continue
}

module.exports = admin;
