import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Product, ProductResponse } from '../product.model';

// ── Fake product data ─────────────────────────────────────────
// Stored in memory. All CRUD operations modify this array.
// Changes persist until the page is refreshed.
const FAKE_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Wireless Bluetooth Headphones',
    description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear sound quality. Perfect for music lovers and remote workers.',
    price: 79.99,
    image: 'https://picsum.photos/seed/headphones/400/400',
    category: 'Electronics',
    rating: 4.5,
    stock: 15
  },
  {
    id: 2,
    name: 'Smart Watch Pro',
    description: 'Feature-packed smartwatch with heart rate monitoring, GPS tracking, sleep analysis, and a stunning AMOLED display. Water-resistant up to 50 meters.',
    price: 199.99,
    image: 'https://picsum.photos/seed/smartwatch/400/400',
    category: 'Electronics',
    rating: 4.2,
    stock: 8
  },
  {
    id: 3,
    name: 'Portable Bluetooth Speaker',
    description: 'Compact and powerful wireless speaker with 360-degree sound, IPX7 waterproofing, and 12-hour playback. Take your music anywhere.',
    price: 49.99,
    image: 'https://picsum.photos/seed/speaker/400/400',
    category: 'Electronics',
    rating: 4.0,
    stock: 22
  },
  {
    id: 4,
    name: 'Classic Denim Jacket',
    description: 'Timeless denim jacket crafted from premium cotton. Features a comfortable regular fit, button closure, and multiple pockets.',
    price: 89.99,
    image: 'https://picsum.photos/seed/denim-jacket/400/400',
    category: 'Clothing',
    rating: 4.7,
    stock: 12
  },
  {
    id: 5,
    name: 'Running Sneakers Ultra',
    description: 'Lightweight performance running shoes with responsive cushioning and breathable mesh upper. Engineered for comfort on long runs.',
    price: 129.99,
    image: 'https://picsum.photos/seed/sneakers/400/400',
    category: 'Clothing',
    rating: 4.6,
    stock: 18
  },
  {
    id: 6,
    name: 'Wool Blend Overcoat',
    description: 'Elegant wool blend overcoat perfect for cooler weather. Tailored silhouette with notch lapels and fully lined interior.',
    price: 159.99,
    image: 'https://picsum.photos/seed/overcoat/400/400',
    category: 'Clothing',
    rating: 4.3,
    stock: 5
  },
  {
    id: 7,
    name: 'The Art of Clean Code',
    description: 'A comprehensive guide to writing maintainable, readable, and efficient code. Covers best practices, design patterns, and refactoring techniques.',
    price: 34.99,
    image: 'https://picsum.photos/seed/coding-book/400/400',
    category: 'Books',
    rating: 4.8,
    stock: 30
  },
  {
    id: 8,
    name: 'Modern JavaScript Deep Dive',
    description: 'Master JavaScript from fundamentals to advanced concepts. Covers ES6+, async programming, closures, prototypes, and modern patterns.',
    price: 44.99,
    image: 'https://picsum.photos/seed/js-book/400/400',
    category: 'Books',
    rating: 4.9,
    stock: 25
  },
  {
    id: 9,
    name: 'Design Patterns Handbook',
    description: 'Learn the 23 classic design patterns with modern examples in TypeScript and JavaScript. Includes UML diagrams and code samples.',
    price: 39.99,
    image: 'https://picsum.photos/seed/patterns-book/400/400',
    category: 'Books',
    rating: 4.4,
    stock: 20
  },
  {
    id: 10,
    name: 'Ceramic Plant Pot Set',
    description: 'Set of 3 minimalist ceramic pots in varying sizes. Features drainage holes and matching saucers. Matte finish in neutral tones.',
    price: 29.99,
    image: 'https://picsum.photos/seed/plant-pots/400/400',
    category: 'Home',
    rating: 4.1,
    stock: 35
  },
  {
    id: 11,
    name: 'LED Desk Lamp',
    description: 'Adjustable LED desk lamp with 5 brightness levels and 3 color temperatures. Features a USB charging port and flexible gooseneck.',
    price: 54.99,
    image: 'https://picsum.photos/seed/desk-lamp/400/400',
    category: 'Home',
    rating: 4.3,
    stock: 14
  },
  {
    id: 12,
    name: 'Scented Candle Collection',
    description: 'Luxury soy wax candle set with 4 seasonal fragrances: lavender, vanilla, cedarwood, and ocean breeze. 45 hours burn time each.',
    price: 24.99,
    image: 'https://picsum.photos/seed/candles/400/400',
    category: 'Home',
    rating: 4.6,
    stock: 40
  }
];

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private products: Product[] = FAKE_PRODUCTS.map(p => ({ ...p, disabled: false }));
  private nextId = 13;

  // ─── STOREFRONT METHODS ─────────────────────────────────────
  // These filter out disabled products.

  getProducts(params?: { search?: string; category?: string; page?: number; limit?: number }): Observable<ProductResponse> {
    let result = this.products.filter(p => !p.disabled);

    if (params?.category) {
      result = result.filter(p => p.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params?.search) {
      const term = params.search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    const total = result.length;
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const offset = (page - 1) * limit;
    const paged = result.slice(offset, offset + limit);

    return of({ products: paged, total, page, totalPages: Math.ceil(total / limit) });
  }

  getAllProducts(): Observable<Product[]> {
    return of(this.products.filter(p => !p.disabled));
  }

  getProductById(id: number): Observable<Product> {
    const product = this.products.find(p => p.id === id);
    if (!product) {
      return throwError(() => ({ status: 404, error: 'Product not found' }));
    }
    return of({ ...product });
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return of(
      this.products.filter(p => !p.disabled && p.category.toLowerCase() === category.toLowerCase())
    );
  }

  searchProducts(term: string): Observable<Product[]> {
    const lower = term.toLowerCase();
    return of(
      this.products.filter(p =>
        !p.disabled &&
        (p.name.toLowerCase().includes(lower) || p.description.toLowerCase().includes(lower))
      )
    );
  }

  getCategories(): Observable<string[]> {
    const cats = [...new Set(this.products.filter(p => !p.disabled).map(p => p.category))];
    return of(cats.sort());
  }

  getFeaturedProducts(): Observable<Product[]> {
    return of(
      this.products.filter(p => !p.disabled).sort((a, b) => b.rating - a.rating).slice(0, 4)
    );
  }

  // ─── ADMIN METHODS ──────────────────────────────────────────

  /** Get ALL products including disabled (for admin table) */
  getAllProductsAdmin(): Observable<Product[]> {
    return of([...this.products]);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    const newProduct: Product = {
      id: this.nextId++,
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      image: product.image || 'https://picsum.photos/seed/new-product/400/400',
      category: product.category || 'Uncategorized',
      rating: product.rating || 0,
      stock: product.stock || 0,
      disabled: product.disabled || false
    };
    this.products.push(newProduct);
    return of(newProduct);
  }

  updateProduct(id: number, updates: Partial<Product>): Observable<Product> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      return throwError(() => ({ status: 404, error: 'Product not found' }));
    }
    this.products[index] = { ...this.products[index], ...updates };
    return of(this.products[index]);
  }

  deleteProduct(id: number): Observable<{ message: string }> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      return throwError(() => ({ status: 404, error: 'Product not found' }));
    }
    this.products.splice(index, 1);
    return of({ message: 'Product deleted successfully.' });
  }

  toggleDisabled(id: number): Observable<Product> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      return throwError(() => ({ status: 404, error: 'Product not found' }));
    }
    this.products[index].disabled = !this.products[index].disabled;
    return of(this.products[index]);
  }
}
