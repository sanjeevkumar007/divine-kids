import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  description: string = 'Divine Kids is dedicated to providing faith-based educational resources for children, fostering spiritual growth and learning in a nurturing environment.';
  email: string = '';
  currentYear: number = new Date().getFullYear();

  subscribe() {
    if (!this.email) return;
    console.log('Subscribed with email:', this.email);
    this.email = '';
  }
}
