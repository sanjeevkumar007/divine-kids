import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../models/nav-models/product';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../common/services/category-service.service';
import { ProductService } from '../common/services/product-service.service';
import { Category } from '../models/nav-models/category';

import { RouterLink, Router } from '@angular/router';
@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService)
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  // route/category
  categoryId = 0;
  placeholder = 'assets/images/placeholder.png';
  // UI state
  sortBy: 'relevance' | 'price-asc' | 'price-desc' = 'relevance';
  pageSize = 48;
  selectedColors = new Set<string>();

  // mock data (replace with API later)
  products: Product[] = [
  ];

  // loaded categories
  category: Category | null | undefined = null;
  categories: Category[] = [];

  allColors = ['Black', 'Blue', 'Black/Silver'];

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => {
      this.categoryId = Number(p.get('id') || 0);

      //   this.productService.getProductByCategoryId(this.categoryId).subscribe((data: unknown) => {
      //     this.products = Array.isArray(data) ? data as Product[] : [];
      //     window.scrollTo({ top: 0, behavior: 'smooth' });
      //     // If categories already loaded, update category now
      //     if (this.categories.length) this.getCategory(this.categoryId);
      //   });
      // });

      this.productService.getProductByCategoryId(this.categoryId).subscribe({
        next: (data) => {
          this.products = Array.isArray(data) ? data as Product[] : [];
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (err) => {
          console.error('Error fetching products:', err);
        }
      });

      this.categoryService.getCategories().subscribe({
        next: (data) => {
          if (data && Array.isArray(data)) {
            this.categories = data as Category[];
            // Now that categories are here, resolve category
            if (this.categoryId) this.getCategory(this.categoryId);
          }
        }
      });
    });
    // Removed: this.getCategory(this.categoryId);
  }

  getCategory(categoryId: number): Category | undefined {
    this.category = this.categories.find(c => c.id === categoryId);
    return this.category;
  }

  toggleColor(color: string) {
    if (this.selectedColors.has(color)) this.selectedColors.delete(color);
    else this.selectedColors.add(color);
  }

  get filteredProduct(): Product[] {
    let list = this.products.filter(p => p.categoryId === this.categoryId);
    if (this.selectedColors.size) {
      list = list.filter(p => p.color && this.selectedColors.has(p.color));
    }
    switch (this.sortBy) {
      case 'price-asc': list = list.slice().sort((a, b) => a.price - b.price); break;
      case 'price-desc': list = list.slice().sort((a, b) => b.price - a.price); break;
      default: break; // relevance stub
    }
    return list.slice(0, this.pageSize);
  }

  img(p: Product): string {
    if (!p?.imageUrl) return this.placeholder;
    // If already an absolute URL
    if (/^https?:\/\//i.test(p.imageUrl)) return p.imageUrl;
    // Ensure it points to assets (adjust path if needed)
    return p.imageUrl.startsWith('assets/')
      ? p.imageUrl
      : `assets/images/products/${p.imageUrl}`;
  }

  goToProduct(id: number) {
    if (!id) return;
    this.router.navigate(['/product', id]);
  }
}

