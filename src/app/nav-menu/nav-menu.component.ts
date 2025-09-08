import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, TrackByFunction } from '@angular/core';
import { NavLink } from '../models/nav-models/nav-link';
import { MenuService } from '../_services/menu.service';
import { MainCategoriesResponse } from '../models/nav-models/main-category-response';
import { MainCategory } from '../models/nav-models/main-category';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { identity } from 'rxjs';

@Component({
  selector: 'app-nav-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.css']
})
export class NavMenuComponent implements OnInit {
  menuService = inject(MenuService)
  menuCategoryResponse: MainCategoriesResponse = { mainCategories: [] };
  navLinks: NavLink[] = [];
  trackById: TrackByFunction<NavLink> | undefined;
  ngOnInit(): void {
    this.menuService.getMainCategories().subscribe({
      next: data => {
        this.menuCategoryResponse = data;
        const categories = this.menuCategoryResponse.mainCategories || [];
        console.log(categories);
        this.navLinks = this.mapCategoriesToNavLinks(categories);
      },
      error: err => {
        console.log(err);
      }
    });
  }

  // navLinks: NavLink[] = [
  //   {
  //     label: 'Shop Our Products',
  //     children: [
  //       { label: 'Books', url: '/products/books' },
  //       { label: 'Toys', url: '/products/toys' }
  //     ]
  //   },
  //   {
  //     label: 'Shop By Learning Model',
  //     children: [
  //       { label: 'Montessori', url: '/learning/montessori' },
  //       { label: 'STEM', url: '/learning/stem' }
  //     ]
  //   },
  //   {
  //     label: 'Shop By Learning Environment',
  //     children: [
  //       { label: 'Classroom', url: '/environment/classroom' },
  //       { label: 'Outdoor', url: '/environment/outdoor' }
  //     ]
  //   },
  //   {
  //     label: 'Shop By Industry',
  //     children: [
  //       { label: 'Preschool', url: '/industry/preschool' },
  //       { label: 'Elementary', url: '/industry/elementary' }
  //     ]
  //   },
  //   { label: 'Shop FlagHouse', url: '/flaghouse' },
  //   { label: 'Featured Assortments', url: '/featured' },
  //   { label: 'Deals & Clearance', url: '/deals' },
  //   { label: 'Ideas & Resources', url: '/resources' }
  // ];

  private mapCategoriesToNavLinks(categories: MainCategory[]): NavLink[] {
    return (categories || []).map(cat => ({
      label: cat.name,
      url: undefined,
      id: cat.id,
      children: Array.isArray(cat.categories) && cat.categories.length > 0
        ? cat.categories.map(sub => ({
          label: sub.name,
          url: undefined,
          id: sub.id,
          products: Array.isArray(sub.products) && sub.products.length > 0
            ? sub.products.map(prod => ({
              name: prod.name,
              id: prod.id,
              url: undefined // or set a URL if you have one
            }))
            : undefined
        }))
        : undefined
    }));
  }
}