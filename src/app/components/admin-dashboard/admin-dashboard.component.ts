import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { UserService } from '../../services/user.service';
import { AuctionService } from '../../services/auction.service';
import { CartService } from '../../services/cart.service';
import { Product, Order } from '../../product.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  // Product Stats
  totalProducts = 0;
  activeProducts = 0;
  disabledProducts = 0;
  totalCategories = 0;
  totalStockValue = 0;
  lowStockCount = 0;
  averageRating = 0;
  totalInventory = 0;

  // Order & User Stats
  totalOrders = 0;
  totalRevenue = 0;
  totalUsers = 0;
  activeUsers = 0;

  // Auction Stats
  totalAuctions = 0;
  activeAuctions = 0;

  // Data
  lowStockProducts: Product[] = [];
  topRatedProducts: Product[] = [];
  recentOrders: Order[] = [];
  categoryBreakdown: { name: string; count: number; revenue: number }[] = [];

  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private userService: UserService,
    private auctionService: AuctionService,
    public cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.productService.getAllProductsAdmin().subscribe(products => {
      const active = products.filter(p => !p.disabled);
      const disabled = products.filter(p => p.disabled);

      // Core stats
      this.totalProducts = products.length;
      this.activeProducts = active.length;
      this.disabledProducts = disabled.length;
      this.totalInventory = products.reduce((sum, p) => sum + p.stock, 0);
      this.totalStockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
      this.lowStockCount = products.filter(p => p.stock < 5 && !p.disabled).length;
      this.averageRating = products.length > 0
        ? +(products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)
        : 0;

      // Categories
      const catMap = new Map<string, { count: number; revenue: number }>();
      active.forEach(p => {
        const existing = catMap.get(p.category) || { count: 0, revenue: 0 };
        catMap.set(p.category, {
          count: existing.count + 1,
          revenue: existing.revenue + (p.price * p.stock)
        });
      });
      this.categoryBreakdown = Array.from(catMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue);
      this.totalCategories = this.categoryBreakdown.length;

      // Low stock (< 5 units, active only)
      this.lowStockProducts = active
        .filter(p => p.stock < 5)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5);

      // Top rated
      this.topRatedProducts = [...active]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);
    });

    // ── Order stats ───────────────────────────────────────────
    this.totalOrders = this.orderService.getOrderCount();
    this.totalRevenue = this.orderService.getTotalRevenue();
    this.orderService.getRecentOrders(3).subscribe(orders => {
      this.recentOrders = orders;
    });

    // ── User stats ────────────────────────────────────────────
    this.totalUsers = this.userService.getUserCount();
    this.activeUsers = this.userService.getActiveUserCount();

    // ── Auction stats ────────────────────────────────────────
    this.totalAuctions = this.auctionService.getAuctionCount();
    this.activeAuctions = this.auctionService.getActiveAuctionCount();
  }

  getCategoryEmoji(category: string): string {
    const map: Record<string, string> = {
      'Electronics': '🔌',
      'Clothing': '👕',
      'Books': '📚',
      'Home': '🏠'
    };
    return map[category] || '📦';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'pending': 'status-pending',
      'processing': 'status-processing',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    return map[status] || '';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    });
  }
}
