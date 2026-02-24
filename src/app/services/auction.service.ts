// ============================================================
// AUCTION SERVICE — In-memory auction & bid management
// ============================================================
// ANGULAR CONCEPTS:
//
// 1. In-memory data store (same pattern as OrderService)
//    Six seed auctions and ~15 bids pre-populate the system
//    so the marketplace has realistic data from the start.
//
// 2. Observable-based API
//    Every method returns Observable<T> via RxJS `of()` so
//    component code works identically against a real backend.
//
// 3. Auto-expiration
//    `checkAndEndAuctions()` runs before reads and transitions
//    active auctions past their `endsAt` to ended/sold.
//
// 4. Bid validation
//    `placeBid()` enforces: amount > currentPrice, bidder ≠
//    seller, auction active & not expired.
// ============================================================

import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Auction, Bid } from '../product.model';

// ── Helper: round to 2 decimal places ─────────────────────
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Helper: generate future/past ISO dates relative to now ─
function hoursFromNow(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function daysFromNow(days: number): string {
  return hoursFromNow(days * 24);
}

function daysAgo(days: number): string {
  return hoursFromNow(-days * 24);
}

// ── Seed auctions ─────────────────────────────────────────
const SEED_AUCTIONS: Auction[] = [
  {
    id: 1,
    sellerId: 100,
    sellerName: 'Jane S.',
    title: 'Vintage Mechanical Keyboard',
    description: 'A beautiful Cherry MX Blue mechanical keyboard from the 1990s. Fully restored, all keys tested and working. Includes original keycaps and a custom USB adapter. Perfect for collectors or enthusiasts who love that classic clicky feel.',
    imageUrl: 'https://picsum.photos/seed/mech-keyboard/600/400',
    category: 'Electronics',
    startingPrice: 45.00,
    currentPrice: 78.00,
    bidCount: 4,
    status: 'active',
    createdAt: daysAgo(3),
    endsAt: daysFromNow(2)
  },
  {
    id: 2,
    sellerId: 998,
    sellerName: 'Demo U.',
    title: 'Limited Edition Sneakers',
    description: 'Brand new, never worn limited edition running sneakers. Size 10. Released as part of a collaboration with a famous designer. Original box and authentication card included. Only 500 pairs made worldwide.',
    imageUrl: 'https://picsum.photos/seed/ltd-sneakers/600/400',
    category: 'Clothing',
    startingPrice: 120.00,
    currentPrice: 185.00,
    bidCount: 3,
    status: 'active',
    createdAt: daysAgo(2),
    endsAt: hoursFromNow(5)
  },
  {
    id: 3,
    sellerId: 101,
    sellerName: 'Mark J.',
    title: 'First Edition Novel Collection',
    description: 'A curated set of 5 first edition novels from the 1960s. All in excellent condition with original dust jackets. Includes works by acclaimed authors. A must-have for any serious book collector.',
    imageUrl: 'https://picsum.photos/seed/first-editions/600/400',
    category: 'Books',
    startingPrice: 60.00,
    currentPrice: 95.00,
    bidCount: 3,
    status: 'active',
    createdAt: daysAgo(4),
    endsAt: daysFromNow(1)
  },
  {
    id: 4,
    sellerId: 102,
    sellerName: 'Sarah W.',
    title: 'Handmade Ceramic Vase Set',
    description: 'Set of 3 handmade ceramic vases in earth tones. Each piece is unique with a slightly different glaze pattern. Perfect for modern or rustic home decor. Signed by the artist on the bottom.',
    imageUrl: 'https://picsum.photos/seed/ceramic-vases/600/400',
    category: 'Home',
    startingPrice: 35.00,
    currentPrice: 52.00,
    bidCount: 2,
    status: 'active',
    createdAt: daysAgo(1),
    endsAt: daysFromNow(3)
  },
  {
    id: 5,
    sellerId: 998,
    sellerName: 'Demo U.',
    title: 'Retro Gaming Console Bundle',
    description: 'Classic 16-bit gaming console with 2 controllers, power adapter, and 8 cartridge games. All tested and working. Console has been cleaned inside and out. Minor cosmetic wear consistent with age.',
    imageUrl: 'https://picsum.photos/seed/retro-console/600/400',
    category: 'Electronics',
    startingPrice: 80.00,
    currentPrice: 145.00,
    bidCount: 5,
    status: 'sold',
    createdAt: daysAgo(10),
    endsAt: daysAgo(1),
    winnerId: 101,
    winnerName: 'Mark J.'
  },
  {
    id: 6,
    sellerId: 100,
    sellerName: 'Jane S.',
    title: 'Designer Sunglasses',
    description: 'Authentic designer sunglasses with polarized lenses. Comes with original case and cleaning cloth. Barely used — selling because they don\'t fit my face shape. Retail price was $220.',
    imageUrl: 'https://picsum.photos/seed/designer-shades/600/400',
    category: 'Clothing',
    startingPrice: 55.00,
    currentPrice: 55.00,
    bidCount: 0,
    status: 'cancelled',
    createdAt: daysAgo(7),
    endsAt: daysAgo(2)
  }
];

// ── Seed bids ─────────────────────────────────────────────
const SEED_BIDS: Bid[] = [
  // Auction 1 — Vintage Mechanical Keyboard (4 bids)
  { id: 1,  auctionId: 1, bidderId: 998, bidderName: 'Demo U.',  amount: 50.00,  createdAt: daysAgo(2.5) },
  { id: 2,  auctionId: 1, bidderId: 101, bidderName: 'Mark J.',  amount: 58.00,  createdAt: daysAgo(2) },
  { id: 3,  auctionId: 1, bidderId: 102, bidderName: 'Sarah W.', amount: 65.00,  createdAt: daysAgo(1.5) },
  { id: 4,  auctionId: 1, bidderId: 998, bidderName: 'Demo U.',  amount: 78.00,  createdAt: daysAgo(1) },

  // Auction 2 — Limited Edition Sneakers (3 bids)
  { id: 5,  auctionId: 2, bidderId: 100, bidderName: 'Jane S.',  amount: 135.00, createdAt: daysAgo(1.5) },
  { id: 6,  auctionId: 2, bidderId: 101, bidderName: 'Mark J.',  amount: 155.00, createdAt: daysAgo(1) },
  { id: 7,  auctionId: 2, bidderId: 100, bidderName: 'Jane S.',  amount: 185.00, createdAt: daysAgo(0.5) },

  // Auction 3 — First Edition Novel Collection (3 bids)
  { id: 8,  auctionId: 3, bidderId: 998, bidderName: 'Demo U.',  amount: 70.00,  createdAt: daysAgo(3) },
  { id: 9,  auctionId: 3, bidderId: 102, bidderName: 'Sarah W.', amount: 82.00,  createdAt: daysAgo(2) },
  { id: 10, auctionId: 3, bidderId: 998, bidderName: 'Demo U.',  amount: 95.00,  createdAt: daysAgo(1) },

  // Auction 4 — Handmade Ceramic Vase Set (2 bids)
  { id: 11, auctionId: 4, bidderId: 998, bidderName: 'Demo U.',  amount: 42.00,  createdAt: daysAgo(0.8) },
  { id: 12, auctionId: 4, bidderId: 100, bidderName: 'Jane S.',  amount: 52.00,  createdAt: daysAgo(0.3) },

  // Auction 5 — Retro Gaming Console Bundle (5 bids, ended/sold)
  { id: 13, auctionId: 5, bidderId: 100, bidderName: 'Jane S.',  amount: 90.00,  createdAt: daysAgo(8) },
  { id: 14, auctionId: 5, bidderId: 101, bidderName: 'Mark J.',  amount: 105.00, createdAt: daysAgo(6) },
  { id: 15, auctionId: 5, bidderId: 102, bidderName: 'Sarah W.', amount: 120.00, createdAt: daysAgo(4) },
  { id: 16, auctionId: 5, bidderId: 100, bidderName: 'Jane S.',  amount: 132.00, createdAt: daysAgo(3) },
  { id: 17, auctionId: 5, bidderId: 101, bidderName: 'Mark J.',  amount: 145.00, createdAt: daysAgo(2) }
];

@Injectable({ providedIn: 'root' })
export class AuctionService {

  private auctions: Auction[] = SEED_AUCTIONS.map(a => ({ ...a }));
  private bids: Bid[] = SEED_BIDS.map(b => ({ ...b }));
  private nextAuctionId = 7;
  private nextBidId = 18;

  // ── Auto-expiration ───────────────────────────────────────
  // Transitions active auctions past their end time to
  // 'ended' (no bids) or 'sold' (has bids, sets winner).

  private checkAndEndAuctions(): void {
    const now = new Date();
    this.auctions.forEach(auction => {
      if (auction.status === 'active' && new Date(auction.endsAt) <= now) {
        if (auction.bidCount > 0) {
          // Find the highest bid for this auction
          const auctionBids = this.bids
            .filter(b => b.auctionId === auction.id)
            .sort((a, b) => b.amount - a.amount);
          const topBid = auctionBids[0];
          auction.status = 'sold';
          auction.winnerId = topBid.bidderId;
          auction.winnerName = topBid.bidderName;
        } else {
          auction.status = 'ended';
        }
      }
    });
  }

  // ── Read ──────────────────────────────────────────────────

  /** Get all active auctions (storefront browsing) */
  getActiveAuctions(): Observable<Auction[]> {
    this.checkAndEndAuctions();
    const active = this.auctions
      .filter(a => a.status === 'active')
      .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
    return of(active.map(a => ({ ...a })));
  }

  /** Get all auctions regardless of status (admin) */
  getAllAuctions(): Observable<Auction[]> {
    this.checkAndEndAuctions();
    const sorted = [...this.auctions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return of(sorted.map(a => ({ ...a })));
  }

  /** Get a single auction by ID */
  getAuctionById(id: number): Observable<Auction> {
    this.checkAndEndAuctions();
    const auction = this.auctions.find(a => a.id === id);
    if (!auction) return throwError(() => ({ status: 404, error: 'Auction not found' }));
    return of({ ...auction });
  }

  /** Get auctions created by a specific user */
  getAuctionsBySeller(sellerId: number): Observable<Auction[]> {
    this.checkAndEndAuctions();
    const results = this.auctions
      .filter(a => a.sellerId === sellerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return of(results.map(a => ({ ...a })));
  }

  /** Get auctions a user has bid on */
  getAuctionsByBidder(bidderId: number): Observable<Auction[]> {
    this.checkAndEndAuctions();
    const bidAuctionIds = [...new Set(
      this.bids.filter(b => b.bidderId === bidderId).map(b => b.auctionId)
    )];
    const results = this.auctions
      .filter(a => bidAuctionIds.includes(a.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return of(results.map(a => ({ ...a })));
  }

  /** Get bids for an auction (sorted newest first) */
  getBidsByAuction(auctionId: number): Observable<Bid[]> {
    const auctionBids = this.bids
      .filter(b => b.auctionId === auctionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return of(auctionBids.map(b => ({ ...b })));
  }

  /** Search auctions by title or description */
  searchAuctions(term: string): Observable<Auction[]> {
    this.checkAndEndAuctions();
    const lower = term.toLowerCase();
    const results = this.auctions.filter(a =>
      a.title.toLowerCase().includes(lower) ||
      a.description.toLowerCase().includes(lower) ||
      a.sellerName.toLowerCase().includes(lower) ||
      a.category.toLowerCase().includes(lower)
    );
    return of(results.map(a => ({ ...a })));
  }

  /** Get unique categories from auctions */
  getCategories(): string[] {
    return [...new Set(this.auctions.map(a => a.category))].sort();
  }

  /** Get the highest bid a specific user placed on an auction */
  getUserHighestBid(auctionId: number, userId: number): number {
    const userBids = this.bids
      .filter(b => b.auctionId === auctionId && b.bidderId === userId);
    if (userBids.length === 0) return 0;
    return Math.max(...userBids.map(b => b.amount));
  }

  /** Check if a user is currently the highest bidder on an auction */
  isHighestBidder(auctionId: number, userId: number): boolean {
    const auction = this.auctions.find(a => a.id === auctionId);
    if (!auction || auction.bidCount === 0) return false;
    const topBid = this.bids
      .filter(b => b.auctionId === auctionId)
      .sort((a, b) => b.amount - a.amount)[0];
    return topBid ? topBid.bidderId === userId : false;
  }

  // ── Create ────────────────────────────────────────────────

  /** Create a new auction listing */
  createAuction(data: {
    sellerId: number;
    sellerName: string;
    title: string;
    description: string;
    imageUrl: string;
    category: string;
    startingPrice: number;
    endsAt: string;
  }): Observable<Auction> {
    const auction: Auction = {
      id: this.nextAuctionId++,
      sellerId: data.sellerId,
      sellerName: data.sellerName,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl || 'https://picsum.photos/seed/auction-default/600/400',
      category: data.category,
      startingPrice: round2(data.startingPrice),
      currentPrice: round2(data.startingPrice),
      bidCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      endsAt: data.endsAt
    };
    this.auctions.push(auction);
    return of({ ...auction });
  }

  /** Place a bid on an auction */
  placeBid(auctionId: number, bidderId: number, bidderName: string, amount: number): Observable<Bid> {
    this.checkAndEndAuctions();

    const auction = this.auctions.find(a => a.id === auctionId);
    if (!auction) {
      return throwError(() => ({ error: 'Auction not found' }));
    }
    if (auction.status !== 'active') {
      return throwError(() => ({ error: 'This auction is no longer active' }));
    }
    if (new Date(auction.endsAt) <= new Date()) {
      return throwError(() => ({ error: 'This auction has ended' }));
    }
    if (auction.sellerId === bidderId) {
      return throwError(() => ({ error: 'You cannot bid on your own auction' }));
    }
    const minBid = round2(auction.currentPrice + 1);
    if (amount < minBid) {
      return throwError(() => ({ error: `Bid must be at least $${minBid.toFixed(2)}` }));
    }

    // Create the bid
    const bid: Bid = {
      id: this.nextBidId++,
      auctionId,
      bidderId,
      bidderName,
      amount: round2(amount),
      createdAt: new Date().toISOString()
    };
    this.bids.push(bid);

    // Update auction
    auction.currentPrice = bid.amount;
    auction.bidCount++;

    return of({ ...bid });
  }

  // ── Update ────────────────────────────────────────────────

  /** Cancel an auction (only if seller owns it and status is active) */
  cancelAuction(auctionId: number, sellerId: number): Observable<Auction> {
    const auction = this.auctions.find(a => a.id === auctionId);
    if (!auction) {
      return throwError(() => ({ error: 'Auction not found' }));
    }
    if (auction.sellerId !== sellerId) {
      return throwError(() => ({ error: 'You can only cancel your own auctions' }));
    }
    if (auction.status !== 'active') {
      return throwError(() => ({ error: 'Only active auctions can be cancelled' }));
    }
    auction.status = 'cancelled';
    return of({ ...auction });
  }

  /** Admin: update auction status */
  updateAuctionStatus(id: number, status: Auction['status']): Observable<Auction> {
    const auction = this.auctions.find(a => a.id === id);
    if (!auction) {
      return throwError(() => ({ error: 'Auction not found' }));
    }
    auction.status = status;
    return of({ ...auction });
  }

  // ── Aggregations (for admin dashboard) ────────────────────

  getAuctionCount(): number {
    return this.auctions.length;
  }

  getActiveAuctionCount(): number {
    this.checkAndEndAuctions();
    return this.auctions.filter(a => a.status === 'active').length;
  }

  getTotalBidCount(): number {
    return this.bids.length;
  }
}
