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
//
// 4. ReviewService integration
//    Reviews are loaded alongside the product. The average
//    rating is computed from approved reviews rather than
//    the hardcoded product.rating field. Users can submit
//    reviews if they're logged in and haven't already
//    reviewed this product.
// ============================================================

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';
import { Product, Review } from '../../product.model';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CurrencyPipe, CommonModule, FormsModule, RouterLink, ProductCardComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {

  product: Product | undefined;      // The product to display
  relatedProducts: Product[] = [];   // Products in the same category
  quantity: number = 1;              // Selected quantity

  // ── Reviews ─────────────────────────────────────────────
  reviews: Review[] = [];
  reviewCount = 0;
  averageRating = 0;
  showReviewForm = false;
  hasReviewed = false;
  reviewSubmitted = false;

  // Review form fields
  newRating = 5;
  newTitle = '';
  newComment = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private reviewService: ReviewService,
    public authService: AuthService
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
          this.loadReviews(product.id);
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
   * Load reviews and compute stats for this product.
   */
  private loadReviews(productId: number): void {
    this.reviewService.getReviewsByProduct(productId).subscribe(reviews => {
      this.reviews = reviews;
      this.reviewCount = reviews.length;
      this.averageRating = this.reviewService.getAverageRating(productId);

      // Check if the current user has already reviewed
      const user = this.authService.currentUser();
      if (user) {
        this.hasReviewed = this.reviewService.hasUserReviewed(productId, user.id);
      }
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

  // ── Review Methods ────────────────────────────────────────

  toggleReviewForm(): void {
    this.showReviewForm = !this.showReviewForm;
  }

  submitReview(): void {
    if (!this.product || !this.newTitle.trim() || !this.newComment.trim()) return;

    const user = this.authService.currentUser();
    if (!user) return;

    this.reviewService.submitReview({
      productId: this.product.id,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName.charAt(0)}.`,
      rating: this.newRating,
      title: this.newTitle.trim(),
      comment: this.newComment.trim()
    }).subscribe(review => {
      // Reload reviews to update the list + average
      this.loadReviews(this.product!.id);
      this.showReviewForm = false;
      this.reviewSubmitted = true;
      this.hasReviewed = true;

      // Reset form
      this.newRating = 5;
      this.newTitle = '';
      this.newComment = '';

      // Hide success message after 4 seconds
      setTimeout(() => { this.reviewSubmitted = false; }, 4000);
    });
  }

  markHelpful(reviewId: number): void {
    this.reviewService.markHelpful(reviewId).subscribe(updated => {
      const index = this.reviews.findIndex(r => r.id === updated.id);
      if (index !== -1) {
        this.reviews[index] = updated;
      }
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}
