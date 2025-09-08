import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-unauthorized',
  imports: [CommonModule, RouterModule],
  template: `
  <div class="unauth-wrap">
    <h1>Unauthorized</h1>
    <p>Your session is invalid or expired.</p>
    <a routerLink="/auth" class="btn">Sign In Again</a>
  </div>
  `,
  styles: [`
    .unauth-wrap {
      max-width:480px;
      margin:80px auto;
      text-align:center;
      font-family:system-ui, Arial;
      padding:40px 34px;
      background:#ffffff;
      border:1px solid #e2e8e4;
      border-radius:20px;
      box-shadow:0 8px 28px -10px rgba(0,0,0,.15);
    }
    h1 { margin:0 0 12px; font-size:2rem; color:#0f5625; }
    p { margin:0 0 24px; color:#345; font-weight:500; }
    .btn {
      display:inline-block;
      padding:12px 22px;
      border-radius:14px;
      background:linear-gradient(135deg,#1fb56a,#16934f);
      color:#fff; text-decoration:none; font-weight:600; font-size:14px;
    }
    .btn:hover { filter:brightness(1.05); }
  `]
})
export class UnauthorizedComponent { }
