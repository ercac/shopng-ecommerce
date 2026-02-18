// ============================================================
// USER ROUTES — Admin-only user management
// ============================================================
// All routes require auth + admin middleware.
// ============================================================

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// ─── GET /api/users ────────────────────────────────────────
// Admin only — List all users
router.get('/', auth, admin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/users/:id ────────────────────────────────────
// Admin only — Get a single user
router.get('/:id', auth, admin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── PUT /api/users/:id ────────────────────────────────────
// Admin only — Update user (name, role)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role } = req.body;

    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin".' });
    }

    const result = await pool.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           role = COALESCE($3, role)
       WHERE id = $4
       RETURNING id, email, first_name, last_name, role, created_at`,
      [firstName, lastName, role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── DELETE /api/users/:id ─────────────────────────────────
// Admin only — Delete a user
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account.' });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/users/stats/overview ─────────────────────────
// Admin only — Get dashboard statistics
router.get('/stats/overview', auth, admin, async (req, res) => {
  try {
    const [usersCount, productsCount, ordersCount, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query('SELECT COUNT(*) FROM orders'),
      pool.query('SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status != $1', ['cancelled'])
    ]);

    res.json({
      totalUsers: parseInt(usersCount.rows[0].count),
      totalProducts: parseInt(productsCount.rows[0].count),
      totalOrders: parseInt(ordersCount.rows[0].count),
      totalRevenue: parseFloat(revenue.rows[0].revenue)
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
