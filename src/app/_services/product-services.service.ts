import { inject, Injectable } from '@angular/core';
import { Product } from '../models/nav-models/product';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductServicesService {
  private products: Product[] = [];
  apiUrl = "https://localhost:7257/api" + "Product/GetAllAsync";
  private http = inject(HttpClient)
  constructor() { }

  getAllProducts(forceRefresh = false): Observable<Product[]> {
    if (this.products && !forceRefresh) {
      return of(this.products);
    }
    return this.http.get<Product[]>(this.apiUrl).pipe(
      tap(data => {
        this.products = data;
      })
    );
  }
}
