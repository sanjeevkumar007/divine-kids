import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../models/nav-models/product';


@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit {
  private route = inject(ActivatedRoute);

  // route/category
  categoryId = 0;

  // UI state
  sortBy: 'relevance' | 'price-asc' | 'price-desc' = 'relevance';
  pageSize = 48;
  selectedColors = new Set<string>();

  // mock data (replace with API later)
  products: Product[] = [];

  allColors = ['Black', 'Blue', 'Black/Silver'];

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => {
      this.categoryId = Number(p.get('id') || 0);
      // TODO: fetch by categoryId
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  toggleColor(color: string) {
    if (this.selectedColors.has(color)) this.selectedColors.delete(color);
    else this.selectedColors.add(color);
  }

  get filtered(): Product[] {
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



}