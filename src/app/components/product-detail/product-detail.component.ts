// ============================================================
// PRODUCT DETAIL COMPONENT — Full product information page
// ============================================================
// ANGULAR CONCEPTS:
//
// 1. ActivatedRoute.snapshot.paramMap — Read route parameters.
//    For the URL /product/5, paramMap.get('id') returns '5'.
//
// 2. Router.navigate() — Programmatic navigation.
//    If a product isn't found, we redirect to /products.
//
// 3. Component reuse — We use <app-product-card> here too!
//    The same card component from the product list is reused
//    in the "Related Products" section. That's the power of
//    component-based architecture!
// ============================================================

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../product.model';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, ProductCardComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {

  product: Product | undefined;      // The product to display
  relatedProducts: Product[] = [];   // Products in the same category
  quantity: number = 1;              // Selected quantity

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // Read the :id parameter from the URL
    // snapshot gives us the CURRENT value (doesn't update on changes)
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      const id = Number(idParam);  // Convert string to number

      // Fetch the product from our service
      this.productService.getProductById(id).subscribe({
        next: (product) => {
          this.product = product;
          this.loadRelatedProducts(product);
        },
        error: () => {
          // Product not found — redirect to products page
          this.router.navigate(['/products']);
        }
      });
    }
  }

  /**
   * Load related products from the same category (excluding current).
   */
  private loadRelatedProducts(product: Product): void {
    this.productService.getProductsByCategory(product.category)
      .subscribe(products => {
        this.relatedProducts = products
          .filter(p => p.id !== product.id)  // Exclude current product
          .slice(0, 4);                      // Max 4 related products
      });
  }

  /**
   * Generate star array for rating display.
   */
  getStars(rating: number): string[] {
    const stars: string[] = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push('full');
      else if (rating >= i - 0.5) stars.push('half');
      else stars.push('empty');
    }
    return stars;
  }

  /** Increase the quantity (can't exceed stock) */
  incrementQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  /** Decrease the quantity (minimum 1) */
  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  /** Add the product to the cart with the selected quantity */
  addToCart(): void {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity);
      this.quantity = 1;  // Reset quantity after adding
    }
  }

  /** Handle "Add to Cart" from related product cards */
  onAddToCart(product: Product): void {
    this.cartService.addToCart(product);
  }
}
