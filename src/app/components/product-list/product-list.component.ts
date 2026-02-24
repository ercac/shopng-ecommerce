// ============================================================
// PRODUCT LIST COMPONENT — The product browsing page
// ============================================================
// ANGULAR CONCEPTS:
//
// 1. ActivatedRoute — Access to the current route's information.
//    We use it to read query parameters like ?search=headphones
//    or ?category=Electronics from the URL.
//
// 2. OnInit lifecycle hook — Called once after the component is
//    created. Perfect for fetching initial data.
//
// 3. subscribe() — How you read values from an Observable.
//    queryParams is an Observable because the URL can change
//    while the component is still alive.
//
// 4. Parent-child communication — This component is the PARENT
//    of <app-product-card>. It passes data down via [product]
//    and listens for events via (addedToCart).
// ============================================================

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { Product } from '../../product.model';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule, ProductCardComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {

  // ─── Component State ───────────────────────────────────────
  allProducts: Product[] = [];           // All products from the service
  filteredProducts: Product[] = [];      // Products after filtering
  categories: string[] = [];            // Available category names
  selectedCategory: string = '';        // Currently selected category
  searchTerm: string = '';              // Current search text

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private notify: NotificationService,
    private route: ActivatedRoute        // Gives access to URL info
  ) {}

  /**
   * ngOnInit — Lifecycle hook called after component creation.
   * This is where you do your initial data fetching.
   * Don't do it in the constructor! The constructor should
   * only be used for dependency injection.
   */
  ngOnInit(): void {
    // Load all products from the service
    this.productService.getAllProducts().subscribe(products => {
      this.allProducts = products;
      this.filteredProducts = products;
    });

    // Load category names
    this.productService.getCategories().subscribe(categories => {
      this.categories = categories;
    });

    // Listen to URL query parameter changes
    // This fires when the navbar search redirects here with ?search=...
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchTerm = params['search'];
        this.applyFilters();
      }
      if (params['category']) {
        this.selectedCategory = params['category'];
        this.applyFilters();
      }
    });
  }

  /**
   * Filter products by category.
   * Called when the user clicks a category in the sidebar.
   */
  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  /**
   * Called when the user types in the search input.
   * The (input) event fires on every keystroke.
   */
  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Apply both category and search filters together.
   * This is a common pattern — one method that combines
   * all active filters.
   */
  private applyFilters(): void {
    let result = this.allProducts;

    // Filter by category (if one is selected)
    if (this.selectedCategory) {
      result = result.filter(
        p => p.category === this.selectedCategory
      );
    }

    // Filter by search term (if there is one)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(term) ||
             p.description.toLowerCase().includes(term)
      );
    }

    this.filteredProducts = result;
  }

  /**
   * Handle the addedToCart event from a child ProductCardComponent.
   * $event is the Product that was emitted.
   */
  onAddToCart(product: Product): void {
    this.cartService.addToCart(product);
    this.notify.success(`${product.name} added to cart!`);
  }
}
