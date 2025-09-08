import { Routes } from '@angular/router';
import { authGuard } from './_guards/auth-guard.guard';

export const routes: Routes = [
    {
        path: 'admin',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/admin/admin-layout/admin-layout.component')
            .then(m => m.AdminLayoutComponent),
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'main-categories' },
            {
                path: 'main-categories',
                loadComponent: () => import('./pages/admin/admin-main-categories/admin-main-categories.component')
                    .then(m => m.AdminMainCategoriesComponent)
            },
            {
                path: 'categories',
                loadComponent: () => import('./pages/admin/admin-categories/admin-categories.component')
                    .then(m => m.AdminCategoriesComponent)
            },
            {
                path: 'products',
                loadComponent: () => import('./pages/admin/admin-products/admin-products.component')
                    .then(m => m.AdminProductsComponent)
            }
        ]
    },
    {
        path: 'product/:id',
        loadComponent: () => import('./product/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
    },
    {
        path: 'category/:id',
        runGuardsAndResolvers: 'paramsChange',
        data: { reuse: false },
        loadComponent: () => import('./categories/categories.component').then(m => m.CategoriesComponent)
    },
    {
        path: 'auth',
        loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent)
    },
    {
        path: 'error/unauthorized',
        loadComponent: () => import('./errors/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
    },
    {
        path: 'debug-token',
        loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent)
    },
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: '**', redirectTo: 'home' }
];