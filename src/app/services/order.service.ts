// ============================================================
// ORDER SERVICE — In-memory order management for admin
// ============================================================
// ANGULAR CONCEPTS:
//
// 1. In-memory data store (same pattern as ProductService)
//    Five seed orders pre-populate the system so the admin
//    panel has real-looking data from the start.
//
// 2. Observable-based API
//    Every method returns Observable<T> using RxJS `of()` so
//    the component code is identical to what you'd write
//    against a real HTTP backend.
//
// 3. Computed fields
//    Each order has subtotal, tax (8.25%), fees ($4.99 flat),
//    and total = subtotal + tax + fees.
// ============================================================

import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Order, OrderItem } from '../product.model';

// ── Tax & fee constants ─────────────────────────────────────
const TAX_RATE = 0.0825;   // 8.25%
const FLAT_FEE = 4.99;     // Shipping / processing

// ── Helper: round to 2 decimal places ───────────────────────
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Seed orders ─────────────────────────────────────────────
// Five realistic orders tied to demo users.
const SEED_ORDERS: Order[] = [
  buildOrder(1, 'ORD-10001', 998, 'pending', '2025-12-15T10:23:00Z',
    '742 Evergreen Terrace, Springfield, IL 62704',
    'user@shopng.com', 'Demo', 'User',
    [
      { id: 1, order_id: 1, product_id: 1, quantity: 1, price_at_purchase: 79.99, name: 'Wireless Bluetooth Headphones', image: 'https://picsum.photos/seed/headphones/400/400', category: 'Electronics' },
      { id: 2, order_id: 1, product_id: 10, quantity: 2, price_at_purchase: 29.99, name: 'Ceramic Plant Pot Set', image: 'https://picsum.photos/seed/plant-pots/400/400', category: 'Home' }
    ]
  ),
  buildOrder(2, 'ORD-10002', 100, 'processing', '2026-01-03T14:45:00Z',
    '1600 Pennsylvania Ave NW, Washington, DC 20500',
    'jane.smith@example.com', 'Jane', 'Smith',
    [
      { id: 3, order_id: 2, product_id: 2, quantity: 1, price_at_purchase: 199.99, name: 'Smart Watch Pro', image: 'https://picsum.photos/seed/smartwatch/400/400', category: 'Electronics' }
    ]
  ),
  buildOrder(3, 'ORD-10003', 101, 'shipped', '2026-01-22T09:12:00Z',
    '350 Fifth Avenue, New York, NY 10118',
    'mark.johnson@example.com', 'Mark', 'Johnson',
    [
      { id: 4, order_id: 3, product_id: 7, quantity: 1, price_at_purchase: 34.99, name: 'The Art of Clean Code', image: 'https://picsum.photos/seed/coding-book/400/400', category: 'Books' },
      { id: 5, order_id: 3, product_id: 8, quantity: 1, price_at_purchase: 44.99, name: 'Modern JavaScript Deep Dive', image: 'https://picsum.photos/seed/js-book/400/400', category: 'Books' },
      { id: 6, order_id: 3, product_id: 9, quantity: 1, price_at_purchase: 39.99, name: 'Design Patterns Handbook', image: 'https://picsum.photos/seed/patterns-book/400/400', category: 'Books' }
    ]
  ),
  buildOrder(4, 'ORD-10004', 102, 'delivered', '2026-02-01T16:30:00Z',
    '221B Baker Street, London, CA 90210',
    'sarah.williams@example.com', 'Sarah', 'Williams',
    [
      { id: 7, order_id: 4, product_id: 4, quantity: 1, price_at_purchase: 89.99, name: 'Classic Denim Jacket', image: 'https://picsum.photos/seed/denim-jacket/400/400', category: 'Clothing' },
      { id: 8, order_id: 4, product_id: 5, quantity: 1, price_at_purchase: 129.99, name: 'Running Sneakers Ultra', image: 'https://picsum.photos/seed/sneakers/400/400', category: 'Clothing' }
    ]
  ),
  buildOrder(5, 'ORD-10005', 998, 'cancelled', '2026-02-10T11:05:00Z',
    '742 Evergreen Terrace, Springfield, IL 62704',
    'user@shopng.com', 'Demo', 'User',
    [
      { id: 9, order_id: 5, product_id: 11, quantity: 3, price_at_purchase: 54.99, name: 'LED Desk Lamp', image: 'https://picsum.photos/seed/desk-lamp/400/400', category: 'Home' }
    ]
  )
];

/** Helper to build an order with auto-computed totals */
function buildOrder(
  id: number, orderNumber: string, userId: number,
  status: Order['status'], createdAt: string,
  address: string, email: string, firstName: string, lastName: string,
  items: OrderItem[]
): Order {
  const subtotal = round2(items.reduce((s, i) => s + i.price_at_purchase * i.quantity, 0));
  const tax = round2(subtotal * TAX_RATE);
  const fees = FLAT_FEE;
  const total = round2(subtotal + tax + fees);

  return {
    id, orderNumber, user_id: userId, status, subtotal, tax, fees, total,
    shipping_address: address, created_at: createdAt,
    email, first_name: firstName, last_name: lastName, items
  };
}

@Injectable({ providedIn: 'root' })
export class OrderService {

  private orders: Order[] = SEED_ORDERS.map(o => ({ ...o, items: o.items?.map(i => ({ ...i })) }));
  private nextId = 6;
  private nextOrderNum = 10006;

  // ── Read ──────────────────────────────────────────────────

  /** Get all orders (admin) */
  getAllOrders(): Observable<Order[]> {
    return of([...this.orders].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  }

  /** Get orders for a specific user (storefront order history) */
  getOrdersByUserId(userId: number): Observable<Order[]> {
    const userOrders = this.orders
      .filter(o => o.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return of(userOrders.map(o => ({ ...o, items: o.items?.map(i => ({ ...i })) })));
  }

  /** Get a single order by ID */
  getOrderById(id: number): Observable<Order> {
    const order = this.orders.find(o => o.id === id);
    if (!order) return throwError(() => ({ status: 404, error: 'Order not found' }));
    return of({ ...order, items: order.items?.map(i => ({ ...i })) });
  }

  /** Search orders by order number, customer name, or email */
  searchOrders(term: string): Observable<Order[]> {
    const lower = term.toLowerCase();
    const results = this.orders.filter(o =>
      o.orderNumber.toLowerCase().includes(lower) ||
      (o.email && o.email.toLowerCase().includes(lower)) ||
      (o.first_name && o.first_name.toLowerCase().includes(lower)) ||
      (o.last_name && o.last_name.toLowerCase().includes(lower)) ||
      o.status.toLowerCase().includes(lower)
    );
    return of(results.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  }

  // ── Update ────────────────────────────────────────────────

  /** Update order status */
  updateOrderStatus(id: number, status: Order['status']): Observable<Order> {
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) return throwError(() => ({ status: 404, error: 'Order not found' }));
    this.orders[index] = { ...this.orders[index], status };
    return of(this.orders[index]);
  }

  // ── Aggregations (for dashboard) ──────────────────────────

  getTotalRevenue(): number {
    return round2(
      this.orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total, 0)
    );
  }

  getOrderCount(): number {
    return this.orders.length;
  }

  getRecentOrders(count: number = 5): Observable<Order[]> {
    const sorted = [...this.orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, count);
    return of(sorted);
  }
}
