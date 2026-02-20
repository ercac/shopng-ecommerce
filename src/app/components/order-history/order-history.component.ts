// ============================================================
// ORDER HISTORY COMPONENT — Storefront order list for users
// ============================================================
// ANGULAR CONCEPTS:
//
// 1. Service composition
//    Injects AuthService (to get the current user's ID) and
//    OrderService (to fetch that user's orders). This is the
//    same pattern used in the Settings page.
//
// 2. Expandable card pattern
//    Each order is a card. Clicking it toggles an expanded
//    view showing line items and cost breakdown — reusing
//    the same UX pattern from admin-orders but styled for
//    the storefront.
//
// 3. Route guard reliance
//    The route itself is protected by authGuard, but the
//    component also checks isLoggedIn() as a safety net
//    and redirects to /login if somehow accessed directly.
// ============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Order } from '../../product.model';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css'
})
export class OrderHistoryComponent implements OnInit {

  orders: Order[] = [];
  loading = true;
  expandedOrderId: number | null = null;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Safety net — redirect if not logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const user = this.authService.currentUser();
    if (!user) return;

    this.orderService.getOrdersByUserId(user.id).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  toggleExpand(orderId: number): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
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
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}
