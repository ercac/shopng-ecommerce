// ============================================================
// MY AUCTIONS COMPONENT — User's listings and bid activity
// ============================================================
// Tabbed view: "My Listings" shows auctions the user created,
// "My Bids" shows auctions the user has bid on with
// winning/outbid indicators.
// ============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuctionService } from '../../services/auction.service';
import { AuthService } from '../../services/auth.service';
import { Auction } from '../../product.model';

@Component({
  selector: 'app-my-auctions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-auctions.component.html',
  styleUrl: './my-auctions.component.css'
})
export class MyAuctionsComponent implements OnInit {

  activeTab: 'selling' | 'bidding' = 'selling';
  myListings: Auction[] = [];
  myBids: Auction[] = [];
  loading = true;

  constructor(
    private auctionService: AuctionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.auctionService.getAuctionsBySeller(user.id).subscribe(auctions => {
      this.myListings = auctions;
      this.auctionService.getAuctionsByBidder(user.id).subscribe(bidAuctions => {
        this.myBids = bidAuctions;
        this.loading = false;
      });
    });
  }

  cancelAuction(auctionId: number): void {
    const user = this.authService.currentUser();
    if (!user) return;

    this.auctionService.cancelAuction(auctionId, user.id).subscribe({
      next: (updated) => {
        const index = this.myListings.findIndex(a => a.id === auctionId);
        if (index !== -1) {
          this.myListings[index] = updated;
        }
      },
      error: () => {}
    });
  }

  isWinning(auction: Auction): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    return this.auctionService.isHighestBidder(auction.id, user.id);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'active': 'status-active',
      'ended': 'status-ended',
      'sold': 'status-sold',
      'cancelled': 'status-cancelled'
    };
    return map[status] || '';
  }

  getTimeRemaining(endsAt: string): string {
    const diff = new Date(endsAt).getTime() - new Date().getTime();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
}
