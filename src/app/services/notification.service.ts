// ============================================================
// NOTIFICATION SERVICE — Global toast notifications with Signals
// ============================================================
// Centralised notification system following the CartService
// signal pattern. Components call success(), error(), info(),
// or warning() to show a toast. The NotificationContainerComponent
// reads the active() signal to render toasts in the root shell.
//
// ANGULAR CONCEPTS:
//   - signal() + computed() for reactive state
//   - providedIn: 'root' for app-wide singleton
//   - setTimeout for auto-dismiss scheduling
// ============================================================

import { Injectable, signal, computed } from '@angular/core';
import { AppNotification } from '../product.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  // ─── PRIVATE STATE ───────────────────────────────────────────
  private notifications = signal<AppNotification[]>([]);
  private nextId = 1;

  // ─── PUBLIC COMPUTED SIGNAL ──────────────────────────────────
  // Read-only list of active notifications for the template.
  readonly active = computed(() => this.notifications());

  // ─── MAX VISIBLE ─────────────────────────────────────────────
  private readonly MAX_VISIBLE = 5;

  // ─── PUBLIC METHODS ──────────────────────────────────────────

  /**
   * Show a notification toast.
   * @param message  Text to display
   * @param type     Visual style: success | error | info | warning
   * @param duration Auto-dismiss time in ms (0 = no auto-dismiss)
   */
  show(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'success',
    duration: number = 4000
  ): void {
    const id = this.nextId++;

    const notification: AppNotification = {
      id,
      message,
      type,
      createdAt: Date.now()
    };

    // Add to list, trim oldest if over max
    const current = this.notifications();
    const updated = [...current, notification];
    if (updated.length > this.MAX_VISIBLE) {
      updated.splice(0, updated.length - this.MAX_VISIBLE);
    }
    this.notifications.set(updated);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  /** Shorthand — green success toast */
  success(message: string): void {
    this.show(message, 'success');
  }

  /** Shorthand — red error toast */
  error(message: string): void {
    this.show(message, 'error', 5000);
  }

  /** Shorthand — blue info toast */
  info(message: string): void {
    this.show(message, 'info');
  }

  /** Shorthand — orange warning toast */
  warning(message: string): void {
    this.show(message, 'warning');
  }

  /** Remove a notification by ID */
  dismiss(id: number): void {
    this.notifications.set(
      this.notifications().filter(n => n.id !== id)
    );
  }
}
