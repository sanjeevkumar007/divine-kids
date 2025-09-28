import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridApi, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import { Product } from '../../../models/nav-models/product';
import { ProductService } from '../../../common/services/product-service.service';
import { Category } from '../../../models/nav-models/category';
import { CategoryService } from '../../../common/services/category-service.service';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { of } from 'rxjs';
import { switchMap, map, catchError, finalize } from 'rxjs/operators';
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.css'],
})
export class AdminProductsComponent implements OnInit {

  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  loading = false;
  saving = false;
  savingMessage = '';

  originalImageUrl: string | null = null;
  selectedFile: File | null = null;

  ngOnInit(): void {
    this.productService.getProducts().subscribe(data => {
      this.rowData = data;
    });

    this.categoryService.getCategories().subscribe(data => {
      this.categories = data;
    });
  }

  // Data
  rowData: Product[] = [];
  categories: Category[] = [];

  // Grid
  gridApi!: GridApi<Product>;
  columnDefs: ColDef<Product>[] = [
    { headerName: 'ID', field: 'id', maxWidth: 90, sortable: true, filter: 'agNumberColumnFilter' },
    {
      headerName: 'Image',
      field: 'imageUrl',
      maxWidth: 110,
      filter: false,
      cellRenderer: (p: ICellRendererParams<Product>) => {
        const wrap = document.createElement('div');
        wrap.style.display = 'grid';
        wrap.style.placeItems = 'center';
        const img = document.createElement('img');
        img.src = p.value || '';
        img.alt = p.data?.name || '';
        img.width = 40; img.height = 40;
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.border = '1px solid rgba(0,0,0,.15)';
        wrap.appendChild(img);
        return wrap;
      },
    },
    { headerName: 'Name', field: 'name', sortable: true, filter: true, minWidth: 160, flex: 1 },
    { headerName: 'Description', field: 'description', sortable: true, filter: true, minWidth: 160, flex: 1 },
    { headerName: 'Price', field: 'price', sortable: true, filter: 'agNumberColumnFilter', maxWidth: 140, valueFormatter: p => p.value != null ? `$${p.value.toFixed(2)}` : '' },
    {
      headerName: 'Action',
      maxWidth: 200,
      sortable: false,
      filter: false,
      cellRenderer: () => `
        <div class="dk-actions">
          <button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit">Edit</button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete">Delete</button>
        </div>
      `,
    },
  ];
  defaultColDef: ColDef<Product> = { resizable: true, minWidth: 120 };

  onGridReady(e: GridReadyEvent<Product>) {
    this.gridApi = e.api;
    this.gridApi.addEventListener('cellClicked', (evt: any) => {
      if (evt.colDef?.headerName !== 'Action') return;
      const btn = (evt.event?.target as HTMLElement)?.closest('button[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (action === 'edit') this.openEditModal(evt.data as Product);
      if (action === 'delete') this.askDelete(evt.data as Product);
    });
    setTimeout(() => this.gridApi.sizeColumnsToFit(), 0);
    this.loadProducts();
  }

  loadProducts(forceRefresh = false, after?: () => void) {
    this.loading = true;
    this.gridApi?.showLoadingOverlay();
    this.productService.getProducts(forceRefresh)
      .pipe(finalize(() => {
        this.loading = false;
        after?.();
      }))
      .subscribe({
        next: data => {
          this.rowData = data;
          if (!data.length) this.gridApi?.showNoRowsOverlay(); else this.gridApi?.hideOverlay();
          this.gridApi?.setGridOption('rowData', this.rowData);
        },
        error: err => {
          console.error('Failed to load products', err);
          this.gridApi?.hideOverlay();
        }
      });
  }

  // Modal state
  showFormModal = false;
  isEditForm = false;
  form: Partial<Product> = {};
  previewUrl: string | null = null;

  openAddModal() {
    this.isEditForm = false;
    this.form = { name: '', description: '', price: undefined, imageUrl: '', categoryId: undefined };
    this.resetPreview();
    this.showFormModal = true;
  }

  openEditModal(row: Product) {
    this.isEditForm = true;
    this.originalImageUrl = row.imageUrl ?? null;
    this.form = { ...row, imageUrl: this.originalImageUrl };
    this.resetPreview();
    this.showFormModal = true;
  }

  // Allow force close while saving (pattern like categories)
  closeFormModal(force = false) {
    if (this.saving && !force) return;
    this.showFormModal = false;
    this.resetPreview();
  }

  saveProduct(ev: Event) {
    ev.preventDefault();
    if (this.saving) return;

    const name = (this.form.name || '').trim();
    if (!name) return;

    // Start saving overlay
    this.saving = true;
    this.savingMessage = this.isEditForm ? 'Updating product...' : 'Creating product...';

    // Close modal immediately so overlay is visible
    this.closeFormModal(true);

    // If user didn't upload a new file, avoid keeping blob: URL
    if (typeof this.form.imageUrl === 'string' && /^blob:/i.test(this.form.imageUrl) && !this.selectedFile) {
      this.form.imageUrl = this.originalImageUrl ?? '';
    }

    this.uploadImageIfNeeded()
      .pipe(
        switchMap((uploadedUrl) => {
          if (uploadedUrl) this.form.imageUrl = uploadedUrl;

          if (this.isEditForm && this.form.id != null) {
            return this.productService.updateProduct(this.form.id, this.form as Product).pipe(
              map(result => ({ kind: 'update', result }))
            );
          } else {
            const nextId = (this.rowData.reduce((m, r) => Math.max(m, r.id), 0) || 0) + 1;
            const prod: Product = {
              id: nextId,
              name,
              description: this.form.description || '',
              price: typeof this.form.price === 'number' ? this.form.price : 0,
              imageUrl: this.form.imageUrl || '',
              categoryId: this.form.categoryId || 0,
              requiresShipping: false,
              badges: [],
              rating: 0,
              reviews: 0,
              inStock: false,
              specs: {}
            };
            // Optimistic UI
            this.rowData = [prod, ...this.rowData];
            this.gridApi?.setGridOption('rowData', this.rowData);
            return this.productService.addProduct(prod).pipe(
              map(result => ({ kind: 'add', result, prod }))
            );
          }
        }),
        finalize(() => {
          // End saving
          this.saving = false;
          this.savingMessage = '';
          // Cleanup preview
          if (this.previewUrl && /^blob:/i.test(this.previewUrl)) {
            try { URL.revokeObjectURL(this.previewUrl); } catch { /* ignore */ }
          }
          this.previewUrl = null;
          this.selectedFile = null;
        }),
        catchError(err => {
          console.error('Save flow failed:', err);
          return of(null);
        })
      )
      .subscribe(out => {
        if (!out) return;
        console.log('Save result', out);
        // Refresh server data after successful save to ensure consistency (especially for update)
        this.loadProducts(true);
      });
  }

  private uploadImageIfNeeded() {
    if (!this.selectedFile) return of(null);
    return this.productService.uploadBlob(this.selectedFile).pipe(
      map(r => r.url),
      catchError(err => {
        console.error('Image upload failed:', err);
        return of(null);
      })
    );
  }

  // Delete
  showDeleteModal = false;
  rowToDelete: Product | null = null;
  askDelete(row: Product) { this.rowToDelete = row; this.showDeleteModal = true; }
  confirmDelete() {
    if (!this.rowToDelete) { this.showDeleteModal = false; return; }
    const id = this.rowToDelete.id;
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        console.log('Product deleted:', id);
        this.rowData = this.rowData.filter(r => r.id !== id);
        this.gridApi?.setGridOption('rowData', this.rowData);
      },
      error: (err) => console.error('Error deleting product:', err)
    });
    this.rowToDelete = null;
    this.showDeleteModal = false;
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Max 2 MB'); input.value = ''; return; }
    this.resetPreview();
    this.previewUrl = URL.createObjectURL(file);
    this.form.imageUrl = this.previewUrl;
    this.selectedFile = file;
  }

  private resetPreview() {
    if (this.previewUrl) {
      try { URL.revokeObjectURL(this.previewUrl); } catch { /* ignore */ }
    }
    this.previewUrl = null;
  }
}
