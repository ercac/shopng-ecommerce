// ============================================================
// PRODUCT ROUTES — CRUD operations for products
// ============================================================
// PUBLIC:  GET /api/products, GET /api/products/:id
// ADMIN:   POST, PUT, DELETE /api/products
//
// CONCEPT: RESTful API Design
// GET    = Read (safe, no side effects)
// POST   = Create new resource
// PUT    = Update existing resource
// DELETE = Remove resource
// ============================================================

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// ─── GET /api/products ─────────────────────────────────────
// Public — Get all products with optional filtering & pagination
// Query params: ?search=, ?category=, ?page=, ?limit=
router.get('/', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Add category filter
    if (category) {
      paramCount++;
      query += ` AND LOWER(category) = LOWER($${paramCount})`;
      params.push(category);
    }

    // Add search filter (searches name and description)
    if (search) {
      paramCount++;
      query += ` AND (LOWER(name) LIKE LOWER($${paramCount}) OR LOWER(description) LIKE LOWER($${paramCount}))`;
      params.push(`%${search}%`);
    }

    // Get total count for pagination
    const countResult = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Add sorting and pagination
    query += ' ORDER BY id ASC';
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      products: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Server error fetching products.' });
  }
});

// ─── GET /api/products/categories ──────────────────────────
// Public — Get list of unique categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM products ORDER BY category'
    );
    res.json(result.rows.map(r => r.category));
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/products/:id ─────────────────────────────────
// Public — Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── POST /api/products ────────────────────────────────────
// Admin only — Create a new product
router.post('/', auth, admin, async (req, res) => {
  try {
    const { name, description, price, image, category, rating, stock } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required.' });
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, price, image, category, rating, stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, price, image, category, rating || 0, stock || 0]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Server error creating product.' });
  }
});

// ─── PUT /api/products/:id ─────────────────────────────────
// Admin only — Update an existing product
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, category, rating, stock } = req.body;

    const result = await pool.query(
      `UPDATE products
       SET name = $1, description = $2, price = $3, image = $4,
           category = $5, rating = $6, stock = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [name, description, price, image, category, rating, stock, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Server error updating product.' });
  }
});

// ─── DELETE /api/products/:id ──────────────────────────────
// Admin only — Delete a product
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({ message: 'Product deleted successfully.' });

  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Server error deleting product.' });
  }
});

module.exports = router;
