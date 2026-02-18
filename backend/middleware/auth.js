// ============================================================
// AUTH MIDDLEWARE — Verify JWT tokens on protected routes
// ============================================================
// CONCEPT: Express Middleware
//
// Middleware is a function with (req, res, next) signature.
// It sits between the request and the route handler:
//
//   Request → [auth middleware] → [route handler] → Response
//
// If the token is valid, we attach the user data to req.user
// and call next() to continue to the route handler.
// If invalid, we send a 401 Unauthorized response.
//
// Usage in routes:
//   router.get('/protected', auth, (req, res) => {
//     // req.user is available here!
//   });
// ============================================================

const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  // Read the Authorization header
  // Format: "Bearer eyJhbGciOi..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  // Extract the token (everything after "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify() decodes the token AND checks the signature.
    // If the token was tampered with or expired, it throws an error.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user data to the request object
    // Now any subsequent middleware or route handler can access req.user
    req.user = decoded;

    next();  // Continue to the next middleware or route handler
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = auth;
