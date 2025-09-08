import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MainCategory } from '../../models/nav-models/main-category';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class MainCategoryService {

  private mainCategories: MainCategory[] = [];
  apiBaseUrl = environment.apiUrl;
  http = inject(HttpClient);
  constructor() {
  }

  getMainCategories(forceRefresh = false): Observable<MainCategory[]> {
    if (!forceRefresh && this.mainCategories.length > 0) {
      return of(this.mainCategories);
    }
    return this.http.get<MainCategory[]>(`${this.apiBaseUrl}/MainCategory/GetAllAsync`).pipe(
      tap(data => this.mainCategories = data)
    );
  }

  getMainCategoryById(id: number): Observable<MainCategory> {
    return this.http.get<MainCategory>(`${this.apiBaseUrl}/MainCategory/GetAsync/${id}`);
  }

  addMainCategory(mainCategory: MainCategory): Observable<MainCategory> {
    return this.http.post<MainCategory>(`${this.apiBaseUrl}/MainCategory/AddAsync`, mainCategory);
  }

  updateMainCategory(mainCategoryId: number, mainCategory: MainCategory): Observable<MainCategory> {
    return this.http.put<MainCategory>(`${this.apiBaseUrl}/MainCategory/UpdateAsync/${mainCategoryId}`, mainCategory);
  }

  deleteMainCategory(mainCategoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/MainCategory/DeleteAsync/${mainCategoryId}`);
  }

  uploadBlob(file: File): Observable<{ fileName: string; url: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ fileName: string; url: string }>(`${this.apiBaseUrl}/Blob/UploadImage`, fd);
  }
}
