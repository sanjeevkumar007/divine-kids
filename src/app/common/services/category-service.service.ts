import { inject, Injectable } from '@angular/core';
import { MainCategory } from '../../models/nav-models/main-category';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Category } from '../../models/nav-models/category';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private categories: Category[] | null = null;
  apiBaseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private apiRoot = this.apiBaseUrl.replace(/\/api\/?$/, '');
  constructor() { }

  getCategories(forceRefresh = false): Observable<Category[]> {
    if (this.categories && !forceRefresh) {
      return of(this.categories);
    }
    return this.http.get<Category[]>(this.apiBaseUrl + "/Category/GetAllAsync").pipe(
      tap(data => this.categories = data)
    );
  }

  deleteCategoryById(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/Category/DeleteAsync/${categoryId}`).pipe(
      tap(() => {
        this.categories = this.categories?.filter(cat => cat.id !== categoryId) || null;
      })
    );
  }

  getByCategoryId(categoryId: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiBaseUrl}/Category/GetAsync/${categoryId}`);
  }

  addCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(`${this.apiBaseUrl}/Category/AddAsync`, category).pipe(
      tap(newCategory => {
        this.categories = this.categories ? [...this.categories, newCategory] : [newCategory];
      })
    );
  }

  updateCategory(categoryId: number, category: Category): Observable<Category> {
    return this.http.put<Category>(`${this.apiBaseUrl}/Category/UpdateAsync/${categoryId}`, category).pipe(
      tap(updatedCategory => {
        this.categories = this.categories?.map(cat => cat.id === categoryId ? updatedCategory : cat) || null;
      })
    );
  }

  uploadBlob(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ fileName: string; url: string }>(`${this.apiBaseUrl}/Upload/UploadBlob`, fd);
  }

  toAbsolute(imageUrl: string): any {
    if (!imageUrl) return undefined;
    if (/^(https?:)?\/\//i.test(imageUrl)) return imageUrl;
    if (imageUrl.startsWith('/')) return this.apiRoot + imageUrl;
    return `${this.apiRoot}/${imageUrl}`;
  }
}