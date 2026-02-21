# ShopNG — Full-Stack E-Commerce Platform

> **Angular 17 + Express.js + PostgreSQL**
> A modern e-commerce application with role-based admin panel, JWT authentication, and reactive state management.

---

## Weekly Progress

| Week | Date | What Was Done |
|------|------|---------------|
| 1 | Feb 2025 | Project scaffolding, product browsing, cart system, checkout flow |
| 2 | Feb 2025 | Admin panel (product CRUD, disable/enable), fake login system, local credentials |
| 3 | Feb 2025 | Register component with form validation, admin dashboard with stats/charts |
| 4 | Feb 2025 | User settings page, checkout auto-fill, admin orders (search, status workflow, cost breakdown), admin users (account management, privacy controls), order history storefront page |
| 5 | | |
| 6 | | |
| 7 | | |
| 8 | | |

---

## Quick Start

```bash
# Install dependencies
npm install

# Start the dev server (frontend only — no backend needed)
ng serve

# Open in browser
http://localhost:4200
```

### Demo Login

Credentials are stored locally in `src/app/credentials.local.ts` (git-ignored).
Default accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@shopng.com | admin123 |
| User | user@shopng.com | user123 |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Angular 17 (Standalone Components) | Modern component architecture, no NgModules |
| State | Angular Signals | Simpler than NgRx for this scope, auto-tracking |
| Forms | Reactive Forms + Template-Driven | Reactive for complex validation, template-driven for CRUD |
| HTTP | HttpClient + Interceptor | Centralized auth token injection |
| Routing | @angular/router + Functional Guards | Route protection with `authGuard` and `adminGuard` |
| Styling | CSS3 + Custom Properties | Design system with variables, no external CSS framework |
| Backend | Express.js | Lightweight REST API server |
| Database | PostgreSQL | Relational data with transactions for order integrity |
| Auth | JWT (jsonwebtoken) + bcryptjs | Stateless authentication, secure password hashing |

---

## Project Structure

```
src/app/
|-- app.component.ts/html/css          Root shell (navbar + router-outlet)
|-- app.routes.ts                      All route definitions
|-- app.config.ts                      App-level providers (router, HTTP, interceptor)
|-- product.model.ts                   TypeScript interfaces (Product, User, Order, etc.)
|-- credentials.local.ts               Demo accounts (git-ignored)
|
|-- environments/
|   |-- environment.ts                 API URL, production flag
|
|-- services/
|   |-- auth.service.ts                Login, logout, session restore, role checks
|   |-- product.service.ts             In-memory CRUD, storefront filtering, admin methods
|   |-- cart.service.ts                Cart state with signals, quantity management
|   |-- order.service.ts               In-memory orders with 5 seeds, search, status updates
|   |-- user.service.ts                In-memory users, search, suspend/reactivate
|   |-- user-profile.service.ts        Profile persistence (localStorage), admin defaults
|
|-- guards/
|   |-- auth.guard.ts                  Blocks unauthenticated users, redirects to /login
|   |-- admin.guard.ts                 Blocks non-admin users, redirects to /
|
|-- interceptors/
|   |-- auth.interceptor.ts            Attaches Bearer token to all HTTP requests
|
|-- pipes/
|   |-- truncate.pipe.ts               Shortens text with configurable limit
|
|-- components/
    |-- navbar/                        Sticky header, search, cart badge, admin link, auth buttons
    |-- home/                          Hero banner, featured products, category grid
    |-- product-list/                  Category sidebar, search, product grid
    |-- product-card/                  Reusable card with image, rating, add-to-cart
    |-- product-detail/                Full product view, quantity selector, related products
    |-- cart/                          Cart items with quantity controls, order summary
    |-- checkout/                      Multi-section form with validation
    |-- login/                         Email/password form with error handling
    |-- register/                      Register form with validation, password match check
    |-- settings/                      User profile form (personal, shipping, payment)
    |-- order-history/                 Storefront order list with expandable detail cards
    |-- admin/                         Admin layout shell with sidebar navigation
    |-- admin-dashboard/               Stats cards (products, revenue, users, alerts), recent orders
    |-- admin-products/                Product table with search, status toggle, delete
    |-- admin-product-form/            Create/edit form with image preview, visibility toggle
    |-- admin-orders/                  Order lookup, search, status workflow, cost breakdown
    |-- admin-users/                   User accounts, roles, suspend/reactivate, privacy controls

backend/
|-- server.js                          Express entry point, middleware stack
|-- config/db.js                       PostgreSQL connection pool
|-- middleware/auth.js                 JWT verification middleware
|-- middleware/admin.js                Role-based access middleware
|-- routes/auth.js                     POST /register, POST /login, GET /me
|-- routes/products.js                 Full CRUD with search, pagination, categories
|-- routes/orders.js                   Order creation (with DB transaction), status updates
|-- routes/users.js                    User management, stats overview
```

---

## Features

### Customer-Facing

- **Product browsing** — Grid layout with category filtering and keyword search
- **Product detail** — Full description, star ratings, stock status, quantity selector, related products
- **Shopping cart** — Add/remove items, adjust quantities, running total
- **Checkout** — Validated form (personal info, shipping address, payment), auto-fills from saved profile
- **Order history** — View past orders with status badges, expandable item/cost details
- **User settings** — Save personal info, shipping address, and payment details for faster checkout
- **Authentication** — Login/register with JWT, persistent sessions via localStorage
- **Responsive design** — Mobile hamburger menu, fluid grid, responsive tables

### Admin Panel

- **Dashboard** — Stats cards (products, revenue, users, low stock alerts), recent orders, category breakdown, quick actions
- **Product management** — Create, edit, delete products with full form validation
- **Disable/enable** — Toggle product visibility on the storefront without deleting
- **Order management** — Search/filter orders, expandable detail view with line items, cost breakdown (subtotal + 8.25% tax + $4.99 fees), status workflow (pending → processing → shipped → delivered)
- **User management** — View registered accounts, search by name/email, role badges, order stats, shipping address access (no payment data), suspend/reactivate accounts
- **Search & filter** — Find products, orders, or users across all admin tables
- **Privacy controls** — Payment information hidden from admin panel, self-lock protection
- **Role protection** — Admin routes guarded by `authGuard` + `adminGuard`; admin nav link hidden from regular users

---

## Architecture Concepts

### Signals (State Management)

Instead of NgRx or BehaviorSubject, the app uses Angular's built-in Signals for reactive state:

```typescript
// CartService — writable signal + computed derived state
private cartItems = signal<CartItem[]>([]);
readonly itemCount = computed(() =>
  this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
);
readonly totalPrice = computed(() =>
  this.cartItems().reduce((sum, item) => sum + item.product.price * item.quantity, 0)
);
```

Templates read signals directly with no `async` pipe or manual subscriptions:

```html
<span class="badge">{{ cartService.itemCount() }}</span>
<span class="total">{{ cartService.totalPrice() | currency }}</span>
```

### Functional Route Guards

Angular 17 favors functions over classes for guards:

```typescript
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAdmin() ? true : router.createUrlTree(['/']);
};
```

### HTTP Interceptor

Every request automatically gets the auth token:

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```

### In-Memory Fake Data

The `ProductService` runs entirely in-memory with 12 products so the app works without a backend. Storefront methods filter out disabled products; admin methods include everything:

```typescript
// Storefront — customers only see active products
getAllProducts(): Observable<Product[]> {
  return of(this.products.filter(p => !p.disabled));
}

// Admin — sees everything including disabled
getAllProductsAdmin(): Observable<Product[]> {
  return of([...this.products]);
}
```

### Authentication Flow

```
Login form  -->  AuthService.login()
                   |
                   |--> Check credentials.local.ts (git-ignored)
                   |      Match? Store "dev-fake-<email>" token, return user
                   |
                   |--> No match? POST /api/auth/login (real backend)
                          Store JWT, return user
                   |
                   v
                 currentUserSignal updates
                   |
                   |--> isLoggedIn() = true
                   |--> isAdmin() = true/false
                   |
                   v
                 Navbar reacts: shows Admin link, Logout button
                 Guards react: allow/block route access
```

---

## API Endpoints (Backend)

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | No | Create account, returns JWT |
| POST | /api/auth/login | No | Authenticate, returns JWT |
| GET | /api/auth/me | Yes | Validate token, return user |

### Products
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/products | No | List products (search, category, pagination) |
| GET | /api/products/categories | No | List unique categories |
| GET | /api/products/:id | No | Single product by ID |
| POST | /api/products | Admin | Create product |
| PUT | /api/products/:id | Admin | Update product |
| DELETE | /api/products/:id | Admin | Delete product |

### Orders
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/orders | Yes | Place order (DB transaction) |
| GET | /api/orders | Yes | List orders (admin: all, user: own) |
| GET | /api/orders/:id | Yes | Order details with items |
| PUT | /api/orders/:id/status | Admin | Update order status |

### Users
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/users | Admin | List all users |
| GET | /api/users/:id | Admin | Single user |
| PUT | /api/users/:id | Admin | Update user role/name |
| DELETE | /api/users/:id | Admin | Delete user (not self) |
| GET | /api/users/stats/overview | Admin | Dashboard statistics |

---

## Data Models

```typescript
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;       // Electronics, Clothing, Books, Home
  rating: number;          // 0-5
  stock: number;
  disabled?: boolean;      // Hidden from storefront when true
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
}

interface Order {
  id: number;
  orderNumber: string;     // "ORD-10001" format
  user_id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;        // Sum of (price x qty)
  tax: number;             // 8.25% of subtotal
  fees: number;            // $4.99 flat shipping/processing
  total: number;           // subtotal + tax + fees
  shipping_address: string;
  items?: OrderItem[];
}

interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  registeredAt: string;
  orderCount: number;
  totalSpent: number;
}

interface UserProfile {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
}
```

---

## Design System

CSS custom properties define the visual language globally in `src/styles.css`:

| Variable | Value | Usage |
|----------|-------|-------|
| `--primary` | #2B3D5A | Navbar, buttons, links |
| `--accent` | #e07a5f | CTA buttons, badges |
| `--success` | #81b29a | Stock indicators, success alerts |
| `--danger` | #e63946 | Delete buttons, error states |
| `--bg` | #f5f5f7 | Page background |
| `--shadow` | 0 2px 8px rgba(0,0,0,0.08) | Cards at rest |
| `--shadow-hover` | 0 8px 24px rgba(0,0,0,0.12) | Cards on hover |
| `--radius` | 12px | Cards, containers |
| `--transition` | cubic-bezier(0.23, 1, 0.32, 1) | All animations |

---

## Security

| Measure | Implementation |
|---------|---------------|
| Credentials not in repo | `credentials.local.ts` is in `.gitignore` |
| Environment files excluded | `.env` and `.env.*` are in `.gitignore` |
| Password hashing | bcryptjs with 10 salt rounds (backend) |
| JWT expiration | Tokens expire after 7 days |
| Route guards | `authGuard` + `adminGuard` protect admin routes |
| Admin UI hidden | Navbar admin link only renders for admin role |
| Interceptor | Auto-attaches token; no manual header management |

---

## Roadmap

- [x] Register component (UI + form validation)
- [x] Admin dashboard with statistics cards and charts
- [x] Admin orders management (search, status workflow, cost breakdown)
- [x] Admin users management (accounts, roles, suspend/reactivate, privacy)
- [x] User settings page (profile, shipping, payment preferences)
- [x] Checkout auto-fill from saved profile
- [x] Order history (storefront view for logged-in users)
- [ ] Product reviews and ratings
- [ ] Real payment integration (Stripe)
- [ ] Image upload for products
- [ ] Email notifications (order confirmation)
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Production deployment

---

## Running the Backend (Optional)

The frontend works standalone with in-memory data. To use the real backend:

```bash
# Set up PostgreSQL and create .env
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Install and run
npm install
node server.js

# Backend runs on http://localhost:3000
```

---

*Last updated: Week 4, February 2025*
