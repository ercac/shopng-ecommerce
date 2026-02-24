// ============================================================
// CREATE AUCTION COMPONENT — List an item for auction
// ============================================================
// Form for logged-in users to create new auction listings.
// Fields: title, description, image URL, category, starting
// price, and duration. Redirects to /auctions on success.
// ============================================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuctionService } from '../../services/auction.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-create-auction',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-auction.component.html',
  styleUrl: './create-auction.component.css'
})
export class CreateAuctionComponent {

  saving = false;
  error = '';

  auction = {
    title: '',
    description: '',
    imageUrl: '',
    category: '',
    startingPrice: 0,
    durationHours: 72
  };

  categories = ['Electronics', 'Clothing', 'Books', 'Home'];

  durationOptions = [
    { label: '1 Hour', value: 1 },
    { label: '6 Hours', value: 6 },
    { label: '12 Hours', value: 12 },
    { label: '1 Day', value: 24 },
    { label: '3 Days', value: 72 },
    { label: '7 Days', value: 168 }
  ];

  constructor(
    private auctionService: AuctionService,
    private authService: AuthService,
    private router: Router,
    private notify: NotificationService
  ) {}

  onSubmit(): void {
    // Validate
    this.error = '';
    if (!this.auction.title.trim()) {
      this.error = 'Title is required.';
      return;
    }
    if (!this.auction.category) {
      this.error = 'Please select a category.';
      return;
    }
    if (this.auction.startingPrice <= 0) {
      this.error = 'Starting price must be greater than $0.';
      return;
    }

    const user = this.authService.currentUser();
    if (!user) {
      this.error = 'You must be logged in to create an auction.';
      return;
    }

    this.saving = true;

    // Compute end time
    const endsAt = new Date();
    endsAt.setHours(endsAt.getHours() + this.auction.durationHours);

    const displayName = `${user.firstName} ${user.lastName.charAt(0)}.`;

    this.auctionService.createAuction({
      sellerId: user.id,
      sellerName: displayName,
      title: this.auction.title.trim(),
      description: this.auction.description.trim(),
      imageUrl: this.auction.imageUrl.trim(),
      category: this.auction.category,
      startingPrice: this.auction.startingPrice,
      endsAt: endsAt.toISOString()
    }).subscribe({
      next: () => {
        this.notify.success('Auction created successfully!');
        setTimeout(() => this.router.navigate(['/auctions']), 1500);
      },
      error: (err) => {
        this.saving = false;
        this.error = err.error || 'Failed to create auction.';
      }
    });
  }
}
