import { inject, Injectable } from '@angular/core';
import { Product } from '../../models/nav-models/product';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private products: Product[] | null = null;
  apiBaseUrl = environment.apiUrl;
  private apiRoot = this.apiBaseUrl.replace(/\/api\/?$/, '');
  private http = inject(HttpClient);

  constructor() { }

  getProducts(forceRefresh = false): Observable<Product[]> {
    if (this.products && !forceRefresh) {
      return of(this.products);
    }
    return this.http.get<Product[]>(`${this.apiBaseUrl}/product/GetAllAsync`).pipe(
      map(list => list.map(p => ({
        ...p,
        imageUrl: this.toAbsolute(p.imageUrl)
      }))),
      tap(list => this.products = list)
    );
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiBaseUrl}/Product/GetAsync/${id}`).pipe(
      map(p => ({
        ...p,
        imageUrl: this.toAbsolute(p.imageUrl)
      }))
    );
  }

  getProductByCategoryId(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiBaseUrl}/Product/GetByCategoryIdAsync/${categoryId}`).pipe(
      map(list => list.map(p => ({
        ...p,
        imageUrl: this.toAbsolute(p.imageUrl)
      }))),
      tap(list => this.products = list)
    );
  }

  addProduct(Product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.apiBaseUrl}/Product/AddAsync`, Product).pipe(
      tap(data => {
        this.products = this.products ? [...this.products, data] : [data];
      })
    );
  }

  updateProduct(id: number, Product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiBaseUrl}/Product/UpdateAsync/${id}`, Product).pipe(
      tap(data => {
        this.products = this.products ? this.products.map(p => p.id === data.id ? data : p) : [data];
      })
    );
  }

  deleteProduct(id: number) {
    return this.http.delete(`${this.apiBaseUrl}/Product/DeleteAsync/${id}`).pipe(
      tap(() => {
        this.products = this.products ? this.products.filter(p => p.id !== id) : [];
      })
    );
  }

  uploadBlob(file: File): Observable<{ fileName: string; url: string }> {
    const fd = new FormData();
    fd.append('file', file, file.name);

    // adjust endpoint if your backend uses a different route
    const uploadUrl = `${this.apiBaseUrl}/Blob/UploadImage`;

    return this.http.post<any>(uploadUrl, fd).pipe(
      map(resp => {
        // normalize common response shapes: { url }, { data: { url } }, string, etc.
        const raw = resp?.url ?? resp?.data?.url ?? resp?.fileUrl ?? resp ?? null;
        const url = typeof raw === 'string' ? this.toAbsolute(raw) : '';
        const fileName = resp?.fileName ?? file.name;
        return { fileName, url };
      }),
      catchError(err => {
        console.error('uploadBlob failed', err);
        return throwError(() => err);
      })
    );
  }

  // ensure toAbsolute treats blob/data/http properly
  toAbsolute(imageUrl: string): string {
    if (!imageUrl) return '';
    if (/^(blob:|data:|https?:\/\/|\/\/)/i.test(imageUrl)) return imageUrl;
    if (imageUrl.startsWith('/')) return this.apiRoot + imageUrl;
    return `${this.apiRoot}/${imageUrl}`;
  }
}