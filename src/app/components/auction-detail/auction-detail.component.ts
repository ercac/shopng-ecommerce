// ============================================================
// AUCTION DETAIL COMPONENT — View auction + place bids
// ============================================================
// Two-column layout showing auction image, info, bid form,
// and bid history. Countdown timer updates every second.
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuctionService } from '../../services/auction.service';
import { AuthService } from '../../services/auth.service';
import { Auction, Bid } from '../../product.model';

@Component({
  selector: 'app-auction-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './auction-detail.component.html',
  styleUrl: './auction-detail.component.css'
})
export class AuctionDetailComponent implements OnInit, OnDestroy {

  auction: Auction | undefined;
  bids: Bid[] = [];
  bidAmount: number = 0;
  bidError = '';
  bidSuccess = false;
  timeRemaining = '';
  private timerInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auctionService: AuctionService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadAuction(Number(idParam));
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private loadAuction(id: number): void {
    this.auctionService.getAuctionById(id).subscribe({
      next: (auction) => {
        this.auction = auction;
        this.bidAmount = Math.ceil(auction.currentPrice + 1);
        this.loadBids(auction.id);
        this.startCountdown();
      },
      error: () => {
        this.router.navigate(['/auctions']);
      }
    });
  }

  private loadBids(auctionId: number): void {
    this.auctionService.getBidsByAuction(auctionId).subscribe(bids => {
      this.bids = bids;
    });
  }

  private startCountdown(): void {
    this.updateCountdown();
    this.timerInterval = setInterval(() => this.updateCountdown(), 1000);
  }

  private updateCountdown(): void {
    if (!this.auction) return;

    const now = new Date().getTime();
    const end = new Date(this.auction.endsAt).getTime();
    const diff = end - now;

    if (diff <= 0) {
      this.timeRemaining = 'Auction Ended';
      if (this.auction.status === 'active') {
        // Reload to get the updated status
        this.loadAuction(this.auction.id);
      }
      if (this.timerInterval) clearInterval(this.timerInterval);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      this.timeRemaining = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      this.timeRemaining = `${hours}h ${minutes}m ${seconds}s`;
    } else {
      this.timeRemaining = `${minutes}m ${seconds}s`;
    }
  }

  get isOwnAuction(): boolean {
    const user = this.authService.currentUser();
    return !!user && !!this.auction && user.id === this.auction.sellerId;
  }

  get canBid(): boolean {
    const user = this.authService.currentUser();
    return !!user
      && !!this.auction
      && this.auction.status === 'active'
      && user.id !== this.auction.sellerId
      && new Date(this.auction.endsAt) > new Date();
  }

  get minimumBid(): number {
    return this.auction ? Math.ceil((this.auction.currentPrice + 1) * 100) / 100 : 0;
  }

  getTimerClass(): string {
    if (!this.auction) return '';
    const diff = new Date(this.auction.endsAt).getTime() - new Date().getTime();
    if (diff <= 0) return 'timer-ended';
    if (diff < 15 * 60 * 1000) return 'timer-critical';
    if (diff < 60 * 60 * 1000) return 'timer-warning';
    return 'timer-normal';
  }

  placeBid(): void {
    if (!this.auction || !this.canBid) return;

    const user = this.authService.currentUser();
    if (!user) return;

    this.bidError = '';
    this.bidSuccess = false;

    const displayName = `${user.firstName} ${user.lastName.charAt(0)}.`;

    this.auctionService.placeBid(
      this.auction.id,
      user.id,
      displayName,
      this.bidAmount
    ).subscribe({
      next: () => {
        this.bidSuccess = true;
        this.loadAuction(this.auction!.id);
        setTimeout(() => { this.bidSuccess = false; }, 4000);
      },
      error: (err) => {
        this.bidError = err.error || 'Failed to place bid';
      }
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  }
}
