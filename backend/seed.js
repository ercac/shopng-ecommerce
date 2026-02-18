// ============================================================
// DATABASE SEED SCRIPT
// ============================================================
// Run this once to create tables and insert initial data:
//   node seed.js
//
// This will:
// 1. Drop existing tables (fresh start)
// 2. Create all tables with proper relationships
// 3. Insert 12 products (same as our mock data)
// 4. Create an admin user (admin@shopng.com / admin123)
// 5. Create a test user (user@shopng.com / user123)
// ============================================================

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting database seed...\n');

    // ── DROP EXISTING TABLES ──────────────────────────────
    // Drop in reverse order of dependencies (child tables first)
    await client.query('DROP TABLE IF EXISTS order_items CASCADE');
    await client.query('DROP TABLE IF EXISTS orders CASCADE');
    await client.query('DROP TABLE IF EXISTS products CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('✅ Dropped existing tables');

    // ── CREATE TABLES ─────────────────────────────────────

    // Users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created users table');

    // Products table
    await client.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(500),
        category VARCHAR(100),
        rating DECIMAL(2, 1) DEFAULT 0,
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created products table');

    // Orders table
    await client.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'pending'
          CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
        total DECIMAL(10, 2) NOT NULL,
        shipping_address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created orders table');

    // Order items table (junction table between orders and products)
    await client.query(`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL,
        price_at_purchase DECIMAL(10, 2) NOT NULL
      )
    `);
    console.log('✅ Created order_items table');

    // ── SEED USERS ────────────────────────────────────────
    // bcrypt.hash(password, saltRounds) — saltRounds=10 is standard
    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash = await bcrypt.hash('user123', 10);

    await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
      ('admin@shopng.com', $1, 'Admin', 'User', 'admin'),
      ('user@shopng.com', $2, 'John', 'Doe', 'user')
    `, [adminHash, userHash]);
    console.log('✅ Created admin and test users');

    // ── SEED PRODUCTS ─────────────────────────────────────
    await client.query(`
      INSERT INTO products (name, description, price, image, category, rating, stock) VALUES
      ('Wireless Bluetooth Headphones',
       'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear sound quality. Perfect for music lovers and remote workers who want to block out distractions.',
       79.99, 'https://picsum.photos/seed/headphones/400/400', 'Electronics', 4.5, 15),

      ('Smart Watch Pro',
       'Feature-packed smartwatch with heart rate monitoring, GPS tracking, sleep analysis, and a stunning AMOLED display. Water-resistant up to 50 meters with 7-day battery life.',
       199.99, 'https://picsum.photos/seed/smartwatch/400/400', 'Electronics', 4.2, 8),

      ('Portable Bluetooth Speaker',
       'Compact and powerful wireless speaker with 360-degree sound, IPX7 waterproofing, and 12-hour playback. Take your music anywhere — from the beach to the mountains.',
       49.99, 'https://picsum.photos/seed/speaker/400/400', 'Electronics', 4.0, 22),

      ('Classic Denim Jacket',
       'Timeless denim jacket crafted from premium cotton. Features a comfortable regular fit, button closure, and multiple pockets. A wardrobe essential that goes with everything.',
       89.99, 'https://picsum.photos/seed/denim-jacket/400/400', 'Clothing', 4.7, 12),

      ('Running Sneakers Ultra',
       'Lightweight performance running shoes with responsive cushioning and breathable mesh upper. Engineered for comfort on long runs with superior arch support.',
       129.99, 'https://picsum.photos/seed/sneakers/400/400', 'Clothing', 4.6, 18),

      ('Wool Blend Overcoat',
       'Elegant wool blend overcoat perfect for cooler weather. Tailored silhouette with notch lapels, two-button closure, and fully lined interior for warmth and comfort.',
       159.99, 'https://picsum.photos/seed/overcoat/400/400', 'Clothing', 4.3, 5),

      ('The Art of Clean Code',
       'A comprehensive guide to writing maintainable, readable, and efficient code. Covers best practices, design patterns, refactoring techniques, and real-world examples from industry experts.',
       34.99, 'https://picsum.photos/seed/coding-book/400/400', 'Books', 4.8, 30),

      ('Modern JavaScript Deep Dive',
       'Master JavaScript from fundamentals to advanced concepts. Covers ES6+, async programming, closures, prototypes, modules, and practical patterns used in modern web development.',
       44.99, 'https://picsum.photos/seed/js-book/400/400', 'Books', 4.9, 25),

      ('Design Patterns Handbook',
       'Learn the 23 classic design patterns with modern examples in TypeScript and JavaScript. Includes creational, structural, and behavioral patterns with UML diagrams and code samples.',
       39.99, 'https://picsum.photos/seed/patterns-book/400/400', 'Books', 4.4, 20),

      ('Ceramic Plant Pot Set',
       'Set of 3 minimalist ceramic pots in varying sizes. Features drainage holes and matching saucers. Matte finish in neutral tones that complement any interior decor style.',
       29.99, 'https://picsum.photos/seed/plant-pots/400/400', 'Home', 4.1, 35),

      ('LED Desk Lamp',
       'Adjustable LED desk lamp with 5 brightness levels and 3 color temperatures. Features a USB charging port, touch controls, and a flexible gooseneck for perfect positioning.',
       54.99, 'https://picsum.photos/seed/desk-lamp/400/400', 'Home', 4.3, 14),

      ('Scented Candle Collection',
       'Luxury soy wax candle set with 4 seasonal fragrances: lavender, vanilla, cedarwood, and ocean breeze. Each candle provides up to 45 hours of clean, even burn time.',
       24.99, 'https://picsum.photos/seed/candles/400/400', 'Home', 4.6, 40)
    `);
    console.log('✅ Inserted 12 products');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Login credentials:');
    console.log('   Admin: admin@shopng.com / admin123');
    console.log('   User:  user@shopng.com / user123');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
