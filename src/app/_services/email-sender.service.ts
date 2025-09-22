import { inject, Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EmailForm } from '../models/emailform';

@Injectable({
  providedIn: 'root'
})

export class EmailSenderService {
  private http = inject(HttpClient);
  apiUrl = "https://localhost:7257/api" + "/Email/SendEmail";
  constructor() { }

  sendEmail(formData: EmailForm) {
    return this.http.post(this.apiUrl, formData);
  }

}
