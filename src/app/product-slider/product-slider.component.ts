import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Product } from '../models/nav-models/product';
import { ProductService } from '../common/services/product-service.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-slider',
  templateUrl: './product-slider.component.html',
  styleUrls: ['./product-slider.component.css'],
  imports: [CommonModule, RouterLink]
})
export class ProductSliderComponent implements OnInit {

  productService = inject(ProductService)
  products: Product[] = [];
  placeholder = 'assets/images/placeholder.png';

  ngOnInit(): void {
    this.productService.getProducts().subscribe(data => {
      this.products = data;
    });
  }

  img(p: Product) { return p.imageUrl || this.placeholder; }

  currentIndex = 0;

  prev() {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  next() {
    if (this.currentIndex < this.products.length - 1) this.currentIndex++;
  }
}