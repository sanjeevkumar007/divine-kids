import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  description: string = 'Divine Kids is dedicated to providing faith-based educational resources for children, fostering spiritual growth and learning in a nurturing environment.';
  email: string = 'test@email.com';
  currentYear: number = new Date().getFullYear();

  subscribe() {
    console.log('Subscribed with email:', this.email);
  }
}
