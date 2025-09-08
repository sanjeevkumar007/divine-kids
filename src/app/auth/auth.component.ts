import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../common/auth-service.service';
import { Register } from '../models/register';
import { Router } from '@angular/router';
import { User } from '../models/accounts/User';


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

  currentUser = signal<User | null>(null)

  registerData: Register | null = null;


  loginForm!: FormGroup;
  registerForm!: FormGroup;

  private submitting = false;

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
  }

  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const p = group.get('password')?.value;
    const c = group.get('confirm')?.value;
    return p && c && p !== c ? { mismatch: true } : null;
  }

  switch(m: 'login' | 'register') { this.mode = m; }

  submitLogin() {
    if (this.submitting) return;
    this.submitting = true;

    if (this.loginForm.invalid) return;
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        console.log('[AuthComponent] login success token:', this.authService.token);
        this.router.navigate(['/admin/main-categories']);
      },
      error: e => console.error('[AuthComponent] login error', e)
    });
  }

  submitRegister() {
    if (this.submitting) return;
    this.submitting = true;

    if (this.registerForm.invalid) return;
    if (this.registerForm.value.password !== this.registerForm.value.confirm) {
      this.registerForm.get('confirm')?.setErrors({ mismatch: true });
      return;
    }

    if (this.registerForm) {
      this.registerData = {
        phoneNumber: this.registerForm.value.phoneNumber,
        confirm: this.registerForm.value.confirm,
        name: this.registerForm.value.name,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password
      };
    }

    if (!this.registerData) {
      this.submitting = false;
      return;
    }
    this.authService.register(this.registerData).subscribe({
      next: () => { console.log('ok'); this.submitting = false; },
      error: e => { console.error(e); this.submitting = false; }
    });

    console.log('register', this.registerForm.value);
  }
}
