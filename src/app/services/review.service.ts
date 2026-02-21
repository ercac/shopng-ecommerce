// ============================================================
// REVIEW SERVICE — In-memory product reviews
// ============================================================
// ANGULAR CONCEPTS:
//
// 1. Seed data with realistic reviews
//    Multiple reviews per product, spread across users,
//    with varying ratings to make averages meaningful.
//
// 2. Computed average ratings
//    getAverageRating() computes from approved reviews only,
//    so pending/rejected reviews don't affect the storefront.
//
// 3. Moderation workflow
//    Reviews start as 'approved' in seed data, but new user
//    submissions default to 'pending'. Admins can approve
//    or reject from the admin panel.
// ============================================================

import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Review } from '../product.model';

const SEED_REVIEWS: Review[] = [
  // ── Product 1: Wireless Bluetooth Headphones ────────────
  {
    id: 1, productId: 1, userId: 998, userName: 'Demo U.',
    rating: 5, title: 'Best headphones I\'ve owned',
    comment: 'Crystal clear sound quality and the battery lasts forever. The noise cancellation is a game changer for my commute.',
    createdAt: '2025-12-20T14:30:00Z', helpful: 8, status: 'approved'
  },
  {
    id: 2, productId: 1, userId: 100, userName: 'Jane S.',
    rating: 4, title: 'Great sound, slightly tight fit',
    comment: 'Audio quality is fantastic for the price. Only complaint is they feel a bit tight after 2+ hours of use. Would still recommend.',
    createdAt: '2026-01-05T09:15:00Z', helpful: 3, status: 'approved'
  },
  {
    id: 3, productId: 1, userId: 101, userName: 'Mark J.',
    rating: 4, title: 'Solid purchase',
    comment: 'Good build quality and pairs easily with my phone. The carrying case is a nice bonus.',
    createdAt: '2026-01-28T17:45:00Z', helpful: 1, status: 'approved'
  },

  // ── Product 2: Smart Watch Pro ──────────────────────────
  {
    id: 4, productId: 2, userId: 102, userName: 'Sarah W.',
    rating: 5, title: 'Love the health tracking',
    comment: 'The heart rate monitor and sleep tracking are incredibly accurate. Syncs perfectly with my phone. Battery lasts about 3 days.',
    createdAt: '2026-02-05T11:20:00Z', helpful: 12, status: 'approved'
  },
  {
    id: 5, productId: 2, userId: 998, userName: 'Demo U.',
    rating: 4, title: 'Stylish and functional',
    comment: 'Looks great on the wrist and the notifications are handy. Wish the screen was a bit brighter outdoors.',
    createdAt: '2026-01-15T08:00:00Z', helpful: 5, status: 'approved'
  },

  // ── Product 3: Premium Yoga Mat ─────────────────────────
  {
    id: 6, productId: 3, userId: 100, userName: 'Jane S.',
    rating: 5, title: 'Non-slip and comfortable',
    comment: 'Perfect thickness — not too thin, not too bulky. The grip is excellent even during hot yoga.',
    createdAt: '2025-11-10T16:00:00Z', helpful: 6, status: 'approved'
  },

  // ── Product 4: Classic Denim Jacket ─────────────────────
  {
    id: 7, productId: 4, userId: 102, userName: 'Sarah W.',
    rating: 5, title: 'Perfect fit and quality denim',
    comment: 'The fit is exactly as described. The denim is heavy enough to feel premium but not stiff. Already getting compliments.',
    createdAt: '2026-02-02T13:30:00Z', helpful: 4, status: 'approved'
  },
  {
    id: 8, productId: 4, userId: 101, userName: 'Mark J.',
    rating: 3, title: 'Good jacket, runs small',
    comment: 'Quality is nice but I had to size up. If you\'re between sizes, go with the larger one.',
    createdAt: '2026-01-20T10:45:00Z', helpful: 7, status: 'approved'
  },

  // ── Product 7: The Art of Clean Code ────────────────────
  {
    id: 9, productId: 7, userId: 101, userName: 'Mark J.',
    rating: 5, title: 'Must-read for developers',
    comment: 'Changed how I think about writing code. Practical examples and clear explanations. Keep it on your desk.',
    createdAt: '2026-01-25T19:00:00Z', helpful: 15, status: 'approved'
  },
  {
    id: 10, productId: 7, userId: 100, userName: 'Jane S.',
    rating: 4, title: 'Good principles, some basics',
    comment: 'Great refresher on clean code practices. A few chapters felt elementary if you have 3+ years experience, but still worth it.',
    createdAt: '2026-02-08T07:30:00Z', helpful: 2, status: 'approved'
  },

  // ── Product 5: Running Sneakers Ultra ───────────────────
  {
    id: 11, productId: 5, userId: 998, userName: 'Demo U.',
    rating: 5, title: 'Like running on clouds',
    comment: 'The cushioning is unreal. Did a half marathon in these and my feet felt fine the next day. Worth every penny.',
    createdAt: '2026-02-12T15:00:00Z', helpful: 9, status: 'approved'
  },

  // ── A pending review (not yet approved) ─────────────────
  {
    id: 12, productId: 2, userId: 101, userName: 'Mark J.',
    rating: 2, title: 'Battery died after 2 months',
    comment: 'Worked great initially but the battery started draining in hours. Might be a defective unit. Waiting on support.',
    createdAt: '2026-02-18T20:00:00Z', helpful: 0, status: 'pending'
  }
];

@Injectable({ providedIn: 'root' })
export class ReviewService {

  private reviews: Review[] = SEED_REVIEWS.map(r => ({ ...r }));
  private nextId = 13;

  // ── Read ──────────────────────────────────────────────────

  /** Get approved reviews for a product (storefront) */
  getReviewsByProduct(productId: number): Observable<Review[]> {
    const result = this.reviews
      .filter(r => r.productId === productId && r.status === 'approved')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return of(result);
  }

  /** Get ALL reviews for a product (admin — includes pending/rejected) */
  getReviewsByProductAdmin(productId: number): Observable<Review[]> {
    const result = this.reviews
      .filter(r => r.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return of(result);
  }

  /** Get all pending reviews across all products (admin moderation queue) */
  getPendingReviews(): Observable<Review[]> {
    return of(this.reviews.filter(r => r.status === 'pending'));
  }

  /** Get all reviews (admin) */
  getAllReviews(): Observable<Review[]> {
    return of([...this.reviews].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  }

  /** Compute average rating from approved reviews for a product */
  getAverageRating(productId: number): number {
    const approved = this.reviews.filter(
      r => r.productId === productId && r.status === 'approved'
    );
    if (approved.length === 0) return 0;
    const sum = approved.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / approved.length) * 10) / 10;
  }

  /** Get the count of approved reviews for a product */
  getReviewCount(productId: number): number {
    return this.reviews.filter(
      r => r.productId === productId && r.status === 'approved'
    ).length;
  }

  /** Check if a user has already reviewed a product */
  hasUserReviewed(productId: number, userId: number): boolean {
    return this.reviews.some(
      r => r.productId === productId && r.userId === userId
    );
  }

  // ── Create ────────────────────────────────────────────────

  /** Submit a new review (starts as 'approved' for demo purposes) */
  submitReview(review: Omit<Review, 'id' | 'createdAt' | 'helpful' | 'status'>): Observable<Review> {
    const newReview: Review = {
      ...review,
      id: this.nextId++,
      createdAt: new Date().toISOString(),
      helpful: 0,
      status: 'approved'     // Auto-approve for demo — real app would use 'pending'
    };
    this.reviews.push(newReview);
    return of(newReview);
  }

  // ── Update ────────────────────────────────────────────────

  /** Mark a review as helpful (increment upvote) */
  markHelpful(reviewId: number): Observable<Review> {
    const index = this.reviews.findIndex(r => r.id === reviewId);
    if (index === -1) return throwError(() => ({ status: 404, error: 'Review not found' }));
    this.reviews[index] = { ...this.reviews[index], helpful: this.reviews[index].helpful + 1 };
    return of(this.reviews[index]);
  }

  /** Admin: update review status (approve/reject) */
  updateReviewStatus(reviewId: number, status: Review['status']): Observable<Review> {
    const index = this.reviews.findIndex(r => r.id === reviewId);
    if (index === -1) return throwError(() => ({ status: 404, error: 'Review not found' }));
    this.reviews[index] = { ...this.reviews[index], status };
    return of(this.reviews[index]);
  }

  // ── Delete ────────────────────────────────────────────────

  /** Admin: delete a review entirely */
  deleteReview(reviewId: number): Observable<void> {
    const index = this.reviews.findIndex(r => r.id === reviewId);
    if (index === -1) return throwError(() => ({ status: 404, error: 'Review not found' }));
    this.reviews.splice(index, 1);
    return of(undefined);
  }

  // ── Aggregations ──────────────────────────────────────────

  getTotalReviewCount(): number {
    return this.reviews.length;
  }

  getPendingCount(): number {
    return this.reviews.filter(r => r.status === 'pending').length;
  }
}
