// ============================================================
// ADMIN AUCTIONS COMPONENT — Manage all auctions
// ============================================================
// Admin-only view with quick stats, search/filter toolbar,
// and expandable table rows showing full auction details
// and bid history. Follows AdminOrdersComponent pattern.
// ============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuctionService } from '../../services/auction.service';
import { Auction, Bid } from '../../product.model';

@Component({
  selector: 'app-admin-auctions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-auctions.component.html',
  styleUrl: './admin-auctions.component.css'
})
export class AdminAuctionsComponent implements OnInit {

  auctions: Auction[] = [];
  filteredAuctions: Auction[] = [];
  searchTerm = '';
  statusFilter = 'all';
  expandedAuctionId: number | null = null;
  expandedBids: Bid[] = [];

  // Stats
  totalAuctions = 0;
  activeCount = 0;
  totalBids = 0;
  soldCount = 0;

  constructor(private auctionService: AuctionService) {}

  ngOnInit(): void {
    this.loadAuctions();
  }

  loadAuctions(): void {
    this.auctionService.getAllAuctions().subscribe(auctions => {
      this.auctions = auctions;
      this.computeStats();
      this.applyFilter();
    });
  }

  private computeStats(): void {
    this.totalAuctions = this.auctions.length;
    this.activeCount = this.auctions.filter(a => a.status === 'active').length;
    this.totalBids = this.auctionService.getTotalBidCount();
    this.soldCount = this.auctions.filter(a => a.status === 'sold').length;
  }

  applyFilter(): void {
    let results = [...this.auctions];

    // Status filter
    if (this.statusFilter !== 'all') {
      results = results.filter(a => a.status === this.statusFilter);
    }

    // Search
    if (this.searchTerm.trim()) {
      const lower = this.searchTerm.toLowerCase();
      results = results.filter(a =>
        a.title.toLowerCase().includes(lower) ||
        a.sellerName.toLowerCase().includes(lower) ||
        a.category.toLowerCase().includes(lower)
      );
    }

    this.filteredAuctions = results;
  }

  toggleExpand(auctionId: number): void {
    if (this.expandedAuctionId === auctionId) {
      this.expandedAuctionId = null;
      this.expandedBids = [];
    } else {
      this.expandedAuctionId = auctionId;
      this.auctionService.getBidsByAuction(auctionId).subscribe(bids => {
        this.expandedBids = bids;
      });
    }
  }

  cancelAuction(auction: Auction): void {
    this.auctionService.updateAuctionStatus(auction.id, 'cancelled').subscribe(updated => {
      const index = this.auctions.findIndex(a => a.id === auction.id);
      if (index !== -1) {
        this.auctions[index] = updated;
        this.computeStats();
        this.applyFilter();
      }
    });
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

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  }

  formatDateShort(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    });
  }
}
