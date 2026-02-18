// ============================================================
// ORDER ROUTES — Create and manage orders
// ============================================================
// AUTH'D:  POST /api/orders, GET /api/orders (own), GET /:id
// ADMIN:   GET /api/orders (all), PUT /:id/status
// ============================================================

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// ─── POST /api/orders ──────────────────────────────────────
// Authenticated — Create a new order from cart items
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const { items, shippingAddress } = req.body;
    // items = [{ productId, quantity, price }]

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ error: 'Shipping address is required.' });
    }

    // Use a database transaction — if any step fails, ALL changes are rolled back
    await client.query('BEGIN');

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create the order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total, shipping_address)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, total, shippingAddress]
    );
    const order = orderResult.rows[0];

    // Insert each order item
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.productId, item.quantity, item.price]
      );

      // Decrease product stock
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.productId]
      );
    }

    await client.query('COMMIT');

    res.status(201).json(order);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Server error creating order.' });
  } finally {
    client.release();
  }
});

// ─── GET /api/orders ───────────────────────────────────────
// Admin: gets ALL orders. Regular user: gets their own orders.
router.get('/', auth, async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'admin') {
      // Admin sees all orders with user info
      query = `
        SELECT o.*, u.email, u.first_name, u.last_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `;
      params = [];
    } else {
      // Regular user sees only their own orders
      query = `
        SELECT * FROM orders
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      params = [req.user.id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Server error fetching orders.' });
  }
});

// ─── GET /api/orders/:id ───────────────────────────────────
// Get order detail with line items
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the order
    const orderResult = await pool.query(
      `SELECT o.*, u.email, u.first_name, u.last_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderResult.rows[0];

    // Check authorization: only the order's owner or admin can view it
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Get order items with product details
    const itemsResult = await pool.query(
      `SELECT oi.*, p.name, p.image, p.category
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({
      ...order,
      items: itemsResult.rows
    });

  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── PUT /api/orders/:id/status ────────────────────────────
// Admin only — Update order status
router.put('/:id/status', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
