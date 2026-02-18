// ============================================================
// EXPRESS SERVER — The main entry point for the backend API
// ============================================================
// CONCEPTS:
//
// 1. Express Middleware — Functions that run on every request.
//    They can modify the request/response, end the request,
//    or pass control to the next middleware with next().
//    Order matters! Middleware runs top-to-bottom.
//
// 2. CORS (Cross-Origin Resource Sharing) — By default, browsers
//    block requests from one domain to another (e.g., Angular on
//    localhost:4200 → Express on localhost:3000). CORS middleware
//    tells the browser "it's OK, allow this."
//
// 3. Route Mounting — We organize routes into separate files
//    and "mount" them at specific paths. All routes in auth.js
//    are prefixed with /api/auth, products.js with /api/products, etc.
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ─────────────────────────────────────────────

// Enable CORS for Angular dev server
app.use(cors({
  origin: 'http://localhost:4200',  // Allow Angular app
  credentials: true                  // Allow cookies/auth headers
}));

// Parse JSON request bodies (req.body will contain parsed JSON)
app.use(express.json());

// Simple request logger (helpful for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();  // Pass to next middleware/route
});

// ─── ROUTE MOUNTING ────────────────────────────────────────
// Each route file handles a specific resource.
// The first argument is the URL prefix.

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));

// ─── HEALTH CHECK ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── ERROR HANDLING ────────────────────────────────────────
// This catches any errors thrown in route handlers.
// Express recognizes it as an error handler because it has 4 parameters.
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── START SERVER ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});
