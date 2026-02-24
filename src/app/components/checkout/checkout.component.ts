// ============================================================
// CHECKOUT COMPONENT — Order form with Reactive Forms
// ============================================================
// ANGULAR CONCEPTS:
//
// 1. Reactive Forms (ReactiveFormsModule)
//    Unlike template-driven forms (which use ngModel), reactive
//    forms are built entirely in TypeScript. You define the form
//    structure, validators, and logic in the component class.
//    This gives you more control and testability.
//
// 2. FormBuilder — A helper service that creates FormGroup and
//    FormControl instances. Less verbose than `new FormGroup({...})`.
//
// 3. Validators — Built-in validation functions:
//    - Validators.required    → Field can't be empty
//    - Validators.email       → Must be valid email format
//    - Validators.minLength   → Minimum character count
//    - Validators.pattern     → Must match a regex pattern
//
// 4. Form state properties:
//    - .valid / .invalid      → Is the form/control valid?
//    - .touched / .untouched  → Has the user interacted with it?
//    - .dirty / .pristine     → Has the value been changed?
//    - .errors                → Object containing active errors
// ============================================================

import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { UserProfileService } from '../../services/user-profile.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  // ReactiveFormsModule provides [formGroup], formControlName, etc.
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {

  checkoutForm!: FormGroup;  // The main form group
  orderPlaced: boolean = false;  // Shows success message after order
  profileAutoFilled: boolean = false;  // Shows auto-fill banner

  constructor(
    private fb: FormBuilder,    // FormBuilder for easier form creation
    public cartService: CartService,
    private router: Router,
    private userProfileService: UserProfileService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    // Guard: Redirect to products if cart is empty
    if (this.cartService.items().length === 0) {
      this.router.navigate(['/products']);
      return;
    }

    // ── Build the form ────────────────────────────────────────
    // FormBuilder.group() creates a FormGroup from an object.
    // Each key becomes a FormControl.
    // The array syntax is: [defaultValue, [validators]]
    this.checkoutForm = this.fb.group({
      // Personal Information
      firstName: ['', [
        Validators.required,
        Validators.minLength(2)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2)
      ]],
      email: ['', [
        Validators.required,
        Validators.email            // Built-in email format validation
      ]],

      // Shipping Address
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', [
        Validators.required,
        Validators.pattern(/^\d{5}$/)  // Exactly 5 digits
      ]],

      // Payment (demo only — not real payment processing!)
      cardName: ['', Validators.required],
      cardNumber: ['', [
        Validators.required,
        Validators.pattern(/^\d{16}$/)  // Exactly 16 digits
      ]],
      expiry: ['', [
        Validators.required,
        Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)  // MM/YY format
      ]],
      cvv: ['', [
        Validators.required,
        Validators.pattern(/^\d{3}$/)  // Exactly 3 digits
      ]]
    });

    // ── Auto-fill from saved profile ────────────────────────────
    // If the user has a saved profile (from Settings page), map
    // its fields onto the checkout form using patchValue().
    // The profile field names differ slightly from checkout fields,
    // so we map them explicitly.
    const profile = this.userProfileService.profile();
    if (profile) {
      this.checkoutForm.patchValue({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        address: profile.shippingAddress,
        city: profile.shippingCity,
        state: profile.shippingState,
        zipCode: profile.shippingZip,
        cardName: profile.cardName,
        cardNumber: profile.cardNumber,
        expiry: profile.cardExpiry,
        cvv: profile.cardCvv
      });
      this.profileAutoFilled = true;
    }
  }

  /**
   * Convenience getter for easy access to form controls in the template.
   * Instead of `checkoutForm.controls['firstName']` you can write `f['firstName']`.
   */
  get f() {
    return this.checkoutForm.controls;
  }

  /**
   * Handle form submission.
   * First marks all fields as touched (to show validation errors),
   * then processes the order if the form is valid.
   */
  onSubmit(): void {
    // Mark all controls as touched to trigger validation display
    // This is useful when a user clicks "Submit" without filling anything
    this.checkoutForm.markAllAsTouched();

    if (this.checkoutForm.valid) {
      // In a real app, you'd send this to a backend API
      console.log('Order placed!', this.checkoutForm.value);

      // Show success message
      this.orderPlaced = true;
      this.notify.success('Order placed successfully!');

      // Clear the cart
      this.cartService.clearCart();

      // Redirect to home after 3 seconds
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 3000);
    }
  }
}
