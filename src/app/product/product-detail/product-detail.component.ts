import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../models/nav-models/product';
import { ProductService } from '../../common/services/product-service.service';
import { CommonModule } from '@angular/common';
import { map, distinctUntilChanged, switchMap, Subject, takeUntil } from 'rxjs';


@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product?: Product;
  loading = true;
  placeholder = 'assets/images/placeholder.png';
  gallery: string[] = [];
  activeImage = '';
  qty = 1;
  tabs = ['Description', 'Specifications', 'Reviews'];
  activeTab = this.tabs[0];
  acc = { desc: true, spec: false, rev: false };

  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.route.paramMap.pipe(
      map(pm => Number(pm.get('id'))),
      distinctUntilChanged(),
      switchMap(id => {
        this.loading = true;
        return this.productService.getProductById(id);
      }),
      takeUntil(this.destroy$)
    ).subscribe(p => {
      this.product = p;
      this.gallery = this.buildGallery(p);
      this.activeImage = this.gallery[0] || this.placeholder;
      this.loading = false;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildGallery(p: Product): string[] {
    const list: string[] = [];
    if (p.imageUrl) list.push(p.imageUrl);
    if (Array.isArray((p as any).images)) {
      for (const img of (p as any).images)
        if (img && !list.includes(img)) list.push(img);
    }
    return list.length ? list : [this.placeholder];
  }

  setActive(src: string) {
    this.activeImage = src;
  }
  onThumbErr(ev: Event) {
    (ev.target as HTMLImageElement).src = this.placeholder;
  }
  toggleAcc(key: 'desc' | 'spec' | 'rev') {
    this.acc[key] = !this.acc[key];
  }
}
