// ============================================================
// DATABASE CONNECTION — PostgreSQL connection pool
// ============================================================
// CONCEPT: Connection Pooling
//
// Instead of opening a new database connection for every request
// (which is slow), we create a "pool" of reusable connections.
// When a route needs to query the database, it borrows a
// connection from the pool and returns it when done.
//
// The `pg` library handles this automatically with Pool.
// ============================================================

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch(err => console.error('❌ Database connection error:', err.message));

// Export the pool so routes can use pool.query(...)
module.exports = pool;
