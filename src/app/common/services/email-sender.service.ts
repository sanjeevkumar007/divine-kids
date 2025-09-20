import { Injectable, inject } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { EmailForm } from '../../models/emailform';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmailSenderService {
  private http = inject(HttpClient);
  private apiBaseUrl = environment.apiUrl;

  sendEmail(model: EmailForm): Observable<any> {
    const fd = new FormData();

    // Helper
    const append = (key: string, value: any) => {
      if (value === undefined || value === null || value === '') return;
      fd.append(key, String(value));
    };

    append('ParentName', model.parentName);
    append('ChildName', model.childName);
    append('ChildAge', model.childAge);
    append('ContactEmail', model.contactEmail);
    append('ContactPhone', model.contactPhone);
    append('PreferredDate', model.preferredDate);
    append('PreferredTime', model.preferredTime);
    append('Notes', model.notes);
    append('SessionMode', model.sessionMode);
    append('Condition', model.condition);
    append('DoctorName', model.doctorName);

    if (model.reportFile) {
      fd.append('ReportFile', model.reportFile, model.reportFile.name);
    }

    return this.http.post(`${this.apiBaseUrl}/Email/SendEmail`, fd);
  }
}
