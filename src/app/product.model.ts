// ============================================================
// DATA MODELS — TypeScript interfaces for the entire app
// ============================================================

/** Represents a product in our store */
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  stock: number;
  disabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Represents an item in the shopping cart */
export interface CartItem {
  product: Product;
  quantity: number;
}

/** Represents a user in the system */
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  createdAt?: string;
  // DB fields use snake_case, API returns camelCase
  first_name?: string;
  last_name?: string;
  created_at?: string;
}

/** Response from login/register endpoints */
export interface AuthResponse {
  token: string;
  user: User;
}

/** Represents an order with full cost breakdown */
export interface Order {
  id: number;
  orderNumber: string;            // Formatted: "ORD-10001"
  user_id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;               // Sum of (price × qty)
  tax: number;                    // Tax amount
  fees: number;                   // Shipping / processing fees
  total: number;                  // subtotal + tax + fees
  shipping_address: string;
  created_at: string;
  // Customer info (joined from users table in admin view)
  email?: string;
  first_name?: string;
  last_name?: string;
  // Line items
  items?: OrderItem[];
}

/** Represents a line item in an order */
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  // Joined from products table
  name?: string;
  image?: string;
  category?: string;
}

/** Represents a user visible in the admin panel */
export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  registeredAt: string;           // ISO date string
  orderCount: number;
  totalSpent: number;
}

/** Represents a user-submitted product review */
export interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;             // Display name (firstName + lastName initial)
  rating: number;               // 1-5
  title: string;
  comment: string;
  createdAt: string;            // ISO date string
  helpful: number;              // Upvote count
  status: 'approved' | 'pending' | 'rejected';
}

/** Dashboard statistics for admin */
export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

/** Paginated product response from API */
export interface ProductResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

/** User profile with saved shipping and payment preferences */
export interface UserProfile {
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
