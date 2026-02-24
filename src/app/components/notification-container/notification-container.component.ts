// ============================================================
// NOTIFICATION CONTAINER — Global toast overlay
// ============================================================
// Rendered once in the root app shell (app.component.html).
// Reads the NotificationService.active() signal and renders
// a stack of toast cards in the top-right corner. Each toast
// auto-dismisses or can be closed manually.
// ============================================================

import { Component } from '@angular/core';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [],
  templateUrl: './notification-container.component.html',
  styleUrl: './notification-container.component.css'
})
export class NotificationContainerComponent {

  constructor(public notificationService: NotificationService) {}

  /** Return an icon character for each notification type */
  getIcon(type: string): string {
    const icons: Record<string, string> = {
      'success': '✓',
      'error': '✕',
      'info': 'ℹ',
      'warning': '⚠'
    };
    return icons[type] || 'ℹ';
  }

  /** Dismiss a toast by ID */
  dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }
}
