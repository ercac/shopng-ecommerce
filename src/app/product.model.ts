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

/** Represents an order */
export interface Order {
  id: number;
  user_id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  shipping_address: string;
  created_at: string;
  // Joined from users table (admin view)
  email?: string;
  first_name?: string;
  last_name?: string;
  // Included in detail view
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
