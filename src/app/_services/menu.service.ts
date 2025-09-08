import { HttpClient } from '@angular/common/http';
import { inject, Injectable, OnInit } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { MainCategory } from '../models/nav-models/main-category';
import { MainCategoriesResponse } from '../models/nav-models/main-category-response';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private mainCategories: MainCategory[] | null = null;
  apiUrl = "https://localhost:7257/api/" + "Catalog/GetCatalogTreeAsync";
  private http = inject(HttpClient);

  constructor() { }

  getMainCategories(forceRefresh = false): Observable<MainCategoriesResponse> {
    if (this.mainCategories && !forceRefresh) {
      return of({ mainCategories: this.sortCategories(this.mainCategories) });
    }
    return this.http.get<MainCategoriesResponse>(this.apiUrl).pipe(
      tap(data => this.mainCategories = this.sortCategories(data.mainCategories))
    );
  }

  private sortCategories(categories: MainCategory[]): MainCategory[] {
    // Sort by id ascending; change to 'name' if you want alphabetical
    return [...categories];
  }
}