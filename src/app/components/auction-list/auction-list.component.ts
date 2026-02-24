// ============================================================
// AUCTION LIST COMPONENT — Browse active auctions
// ============================================================
// Public page where anyone can browse auctions. Logged-in
// users see a "Create Auction" button. Supports search and
// category filtering with countdown timers on each card.
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuctionService } from '../../services/auction.service';
import { AuthService } from '../../services/auth.service';
import { Auction } from '../../product.model';

@Component({
  selector: 'app-auction-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './auction-list.component.html',
  styleUrl: './auction-list.component.css'
})
export class AuctionListComponent implements OnInit, OnDestroy {

  allAuctions: Auction[] = [];
  filteredAuctions: Auction[] = [];
  categories: string[] = [];
  selectedCategory = '';
  searchTerm = '';
  private timerInterval: any;

  constructor(
    private auctionService: AuctionService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAuctions();
    this.categories = this.auctionService.getCategories();

    // Refresh timer display every 30 seconds
    this.timerInterval = setInterval(() => {
      // Triggers change detection for countdown display
      this.filteredAuctions = [...this.filteredAuctions];
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private loadAuctions(): void {
    this.auctionService.getActiveAuctions().subscribe(auctions => {
      this.allAuctions = auctions;
      this.applyFilters();
    });
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let results = [...this.allAuctions];

    if (this.selectedCategory) {
      results = results.filter(a => a.category === this.selectedCategory);
    }

    if (this.searchTerm.trim()) {
      const lower = this.searchTerm.toLowerCase();
      results = results.filter(a =>
        a.title.toLowerCase().includes(lower) ||
        a.description.toLowerCase().includes(lower) ||
        a.sellerName.toLowerCase().includes(lower)
      );
    }

    this.filteredAuctions = results;
  }

  getTimeRemaining(endsAt: string): string {
    const now = new Date().getTime();
    const end = new Date(endsAt).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  getTimerClass(endsAt: string): string {
    const diff = new Date(endsAt).getTime() - new Date().getTime();
    if (diff <= 0) return 'timer-ended';
    if (diff < 15 * 60 * 1000) return 'timer-critical';    // < 15 min
    if (diff < 60 * 60 * 1000) return 'timer-warning';     // < 1 hour
    return 'timer-normal';
  }
}
