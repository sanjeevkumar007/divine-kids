import { HttpClient } from '@angular/common/http';
import { inject, Injectable, OnInit } from '@angular/core';
import { MainCategory } from '../models/nav-models/main-category';
import { Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private mainCategories: MainCategory[] | null = null;
  apiUrl = "" + "";
  private http = inject(HttpClient);

  constructor() { }

  getMainCategories(forceRefresh = false): Observable<MainCategory[]> {
    if (this.mainCategories && !forceRefresh) {
      return of(this.mainCategories);
    }
    return this.http.get<MainCategory[]>(this.apiUrl).pipe(
      tap(data => this.mainCategories = data)
    );
  }
}
