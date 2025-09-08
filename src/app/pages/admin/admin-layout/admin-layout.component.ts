import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { FooterComponent } from "../../../footer/footer.component";
import { AuthService } from '../../../common/auth-service.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, FooterComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
  private authService: AuthService = inject(AuthService)
  private router: Router = inject(Router)

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}