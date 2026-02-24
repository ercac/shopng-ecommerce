// ============================================================
// SETTINGS COMPONENT — User profile & payment preferences
// ============================================================
// ANGULAR CONCEPTS:
//
// 1. Reactive Forms with patchValue()
//    We pre-fill the form from the saved UserProfile (or from
//    the logged-in user's basic info as a fallback).
//    patchValue() lets you set only SOME controls in a FormGroup,
//    unlike setValue() which requires ALL controls.
//
// 2. Signal-based services
//    UserProfileService uses Angular Signals under the hood.
//    We read profile() to get the current snapshot and write
//    back via saveProfile().
//
// 3. OnInit lifecycle hook
//    Form initialisation and pre-fill happen in ngOnInit so
//    the component's dependencies are fully injected first.
// ============================================================

import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserProfileService } from '../../services/user-profile.service';
import { NotificationService } from '../../services/notification.service';
import { UserProfile } from '../../product.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {

  settingsForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    public authService: AuthService,
    private userProfileService: UserProfileService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    // Redirect if not logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // ── Build the form ──────────────────────────────────────
    // Personal info fields are required; payment fields are
    // optional so users aren't forced to enter card data.
    this.settingsForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],

      shippingAddress: ['', Validators.required],
      shippingCity: ['', Validators.required],
      shippingState: ['', Validators.required],
      shippingZip: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],

      // Payment fields — optional (no required validator)
      cardName: [''],
      cardNumber: ['', Validators.pattern(/^\d{16}$/)],
      cardExpiry: ['', Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)],
      cardCvv: ['', Validators.pattern(/^\d{3}$/)]
    });

    // ── Pre-fill from saved profile or auth user ────────────
    const profile = this.userProfileService.profile();
    if (profile) {
      this.settingsForm.patchValue(profile);
    } else {
      // No saved profile yet — at least fill name & email from auth
      const user = this.authService.currentUser();
      if (user) {
        this.settingsForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        });
      }
    }
  }

  /** Convenience getter for template validation */
  get f() {
    return this.settingsForm.controls;
  }

  /** Save profile to localStorage via UserProfileService */
  onSave(): void {
    this.settingsForm.markAllAsTouched();

    if (this.settingsForm.valid) {
      const user = this.authService.currentUser();
      if (!user) return;

      const profile: UserProfile = {
        userId: user.id,
        ...this.settingsForm.value
      };

      this.userProfileService.saveProfile(profile);
      this.notify.success('Settings saved!');
    }
  }
}
