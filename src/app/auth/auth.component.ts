import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../common/auth-service.service';
import { Register } from '../models/register';
import { Router, NavigationEnd } from '@angular/router';
import { User } from '../models/accounts/User';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  mode: 'login' | 'register' = 'login';

  currentUser = signal<User | null>(null);
  registerData: Register | null = null;

  loginForm!: FormGroup;
  registerForm!: FormGroup;

  submitting = false;
  private awaitingNavigation = false;
  processingMessage = 'Signing you in...';

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?\d{7,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', [Validators.required]]
    }, { validators: this.passwordsMatch });

    // Turn off spinner only after the navigation triggered by login completes.
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.awaitingNavigation) {
          this.submitting = false;
          this.awaitingNavigation = false;
        }
      });
  }

  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const p = group.get('password')?.value;
    const c = group.get('confirm')?.value;
    return p && c && p !== c ? { mismatch: true } : null;
  }

  switch(m: 'login' | 'register') { this.mode = m; }

  submitLogin() {
    if (this.submitting) return;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.processingMessage = 'Signing you in...';
    this.submitting = true;
    this.awaitingNavigation = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        console.log('[AuthComponent] login success token:', this.authService.token);
        // Navigate; spinner will stop after NavigationEnd.
        this.router.navigate(['/admin/main-categories']);
      },
      error: e => {
        console.error('[AuthComponent] login error', e);
        this.submitting = false;
        this.awaitingNavigation = false;
      }
    });
  }

  submitRegister() {
    console.log('disabled');
  }
}
