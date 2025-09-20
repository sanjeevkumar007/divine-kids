import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { EmailForm } from '../models/emailform';
import { EmailSenderService } from '../common/services/email-sender.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.css']
})
export class AppointmentComponent {

  private emailSenderService = inject(EmailSenderService);

  form: Partial<EmailForm> = {};
  submitting = false;
  submitSuccess = false;
  submitError: string | null = null;

  selectDoctor(name: string) {
    this.form.doctorName = name;
  }

  onReportsSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large (max 5MB).');
      input.value = '';
      return;
    }
    this.form.reportFile = file;
  }

  submitRequest(f?: NgForm) {
    this.submitSuccess = false;
    this.submitError = null;
    if (!f) return;

    // Client-side required check
    if (f.invalid) {
      Object.values(f.controls).forEach(c => c.markAsTouched());
      return;
    }

    // If server requires ReportFile and doctorName
    if (!this.form.doctorName) {
      this.submitError = 'Please select a doctor.';
      return;
    }
    if (!this.form.reportFile) {
      // If truly required backend keeps failing—enforce here
      this.submitError = 'Please upload a report file.';
      return;
    }

    this.submitting = true;

    const payload: EmailForm = {
      parentName: this.form.parentName?.trim(),
      childName: this.form.childName?.trim(),
      childAge: this.normalizeAge(this.form.childAge),
      contactEmail: this.form.contactEmail,
      contactPhone: this.form.contactPhone,
      preferredDate: this.form.preferredDate,
      preferredTime: this.form.preferredTime,
      notes: this.form.notes,
      sessionMode: this.form.sessionMode,
      condition: this.form.condition,
      doctorName: this.form.doctorName,
      reportFile: this.form.reportFile
    };

    this.emailSenderService.sendEmail(payload).subscribe({
      next: () => {
        this.submitSuccess = true;
        f.resetForm();
        this.form = {};
      },
      error: (err) => {
        console.error(err);
        this.submitError = this.extractValidation(err) ??
          'Could not submit request. Please try again.';
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  private normalizeAge(val: any): number | undefined {
    if (val === '' || val == null) return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }

  private extractValidation(err: any): string | null {
    if (err?.status === 400 && err.error?.errors) {
      const entries = Object.entries(err.error.errors) as [string, string[]][];
      return entries
        .map(([k, arr]) => `${k}: ${arr.join(', ')}`)
        .join(' | ');
    }
    return null;
  }
}
