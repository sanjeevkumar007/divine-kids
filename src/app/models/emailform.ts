export interface EmailForm {
  parentName?: string;
  childName?: string;
  childAge?: number;
  contactEmail?: string;
  contactPhone?: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  sessionMode?: string;
  condition?: string;
  doctorName?: string;       // <-- added
  reportFile?: File;         // <-- optional: if you want to keep uploaded file
}
