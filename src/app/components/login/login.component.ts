// ============================================================
// LOGIN COMPONENT — User authentication form
// ============================================================
// ANGULAR CONCEPTS:
//
// 1. Reactive Forms — FormBuilder creates a FormGroup with
//    controls and validators. More powerful than template-driven
//    forms for complex validation scenarios.
//
// 2. Router — After successful login, we navigate the user to
//    their intended page (via returnUrl query param) or home.
//
// 3. async/await with services — Our AuthService uses Promises,
//    so we use try/catch for clean error handling.
// ============================================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  // The reactive form group containing email and password controls
  loginForm: FormGroup;

  // Error message from the API (e.g., "Invalid credentials")
  errorMessage: string = '';

  // Loading state to disable the button during API calls
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // FormBuilder.group() creates a FormGroup with named controls.
    // Each control is an array: [defaultValue, [...validators]]
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // ── Convenience getter for form controls ──────────────────
  // Instead of writing this.loginForm.get('email') everywhere,
  // we can use f['email'] in the template.
  get f() {
    return this.loginForm.controls;
  }

  // ── Form Submission ───────────────────────────────────────
  async onSubmit(): Promise<void> {
    // Don't submit if the form is invalid
    if (this.loginForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const { email, password } = this.loginForm.value;

      // Call the auth service to log in
      await this.authService.login(email, password);

      // After login, check if there's a returnUrl query parameter.
      // This is set by the authGuard when redirecting to /login.
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
      this.router.navigateByUrl(returnUrl);
    } catch (error: any) {
      // Display the error message from the API
      // The backend returns { error: 'message' } on failure
      this.errorMessage =
        error?.error?.error || 'Login failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}
