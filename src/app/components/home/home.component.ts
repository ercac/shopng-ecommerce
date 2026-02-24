// ============================================================
// HOME COMPONENT — Landing page with hero, featured, categories
// ============================================================
// ANGULAR CONCEPTS:
//
// 1. [queryParams] — Pass query parameters via routerLink.
//    <a [routerLink]="['/products']" [queryParams]="{ category: 'Books' }">
//    This navigates to /products?category=Books
//
// 2. Component composition — Reusing <app-product-card> again!
//    The same component works on the product list page, the
//    product detail page, AND the home page. Maximum reuse!
// ============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuctionService } from '../../services/auction.service';
import { NotificationService } from '../../services/notification.service';
import { Product, Auction } from '../../product.model';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  featuredProducts: Product[] = [];
  categories: string[] = [];
  hotAuctions: Auction[] = [];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private auctionService: AuctionService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    // Fetch featured (top-rated) products for the home page
    this.productService.getFeaturedProducts().subscribe(products => {
      this.featuredProducts = products;
    });

    // Get all category names
    this.productService.getCategories().subscribe(categories => {
      this.categories = categories;
    });

    // Get hot auctions (top 3 by bid count)
    this.auctionService.getActiveAuctions().subscribe(auctions => {
      this.hotAuctions = auctions
        .sort((a, b) => b.bidCount - a.bidCount)
        .slice(0, 3);
    });
  }

  /** Handle add to cart from featured product cards */
  onAddToCart(product: Product): void {
    this.cartService.addToCart(product);
    this.notify.success(`${product.name} added to cart!`);
  }

  /**
   * Returns an emoji for each category.
   * This is just for fun visual display on the home page!
   */
  getCategoryEmoji(category: string): string {
    const emojiMap: { [key: string]: string } = {
      'Electronics': '🔌',
      'Clothing': '👕',
      'Books': '📚',
      'Home': '🏠'
    };
    return emojiMap[category] || '🛍️';
  }
}
