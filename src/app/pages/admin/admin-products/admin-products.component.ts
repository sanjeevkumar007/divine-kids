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
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.css'],
})

export class AdminProductsComponent implements OnInit {

  private productService = inject(ProductService)
  private categoryService = inject(CategoryService)

  selectedFile: File | null = null;
  mainCategoryService: any;

  ngOnInit(): void {
    this.productService.getProducts().subscribe(data => {
      this.rowData = data;
    });

    this.categoryService.getCategories().subscribe(data => {
      this.categories = data;
    });
  }
  // Data
  rowData: Product[] = [
  ];

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
    this.form = { ...row };
    this.resetPreview();
    this.showFormModal = true;
  }

  closeFormModal() {
    this.showFormModal = false;
    this.resetPreview();
  }

  saveProduct(ev: Event) {
    ev.preventDefault();
    const name = (this.form.name || '').trim();
    if (!name) return;

    const persist = (imageUrl?: string) => {
      if (imageUrl) this.form.imageUrl = imageUrl;

      if (this.isEditForm && this.form.id != null) {
        const idx = this.rowData.findIndex(r => r.id === this.form.id);
        if (idx === -1) return;
        this.rowData = this.rowData.map(r => r.id === this.form.id ? { ...r, ...(this.form as Product) } : r);
        this.productService.updateProduct(this.form.id, this.form as Product).subscribe({
          next: (data) => {
            console.log("Product updated:", data);
            this.gridApi?.setGridOption('rowData', this.rowData);
            this.closeFormModal();
          },
          error: (err) => {
            console.error("Error updating product:", err);
          }
        });
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
        this.rowData = [prod, ...this.rowData];
        this.productService.addProduct(prod).subscribe({
          next: (data) => {
            console.log("Product added:", data);
            this.gridApi?.setGridOption('rowData', this.rowData);
            this.closeFormModal();
          },
          error: (err) => {
            console.error("Error adding product:", err);
          }
        });
      }
    };
    if (this.selectedFile) {
      this.productService.uploadBlob(this.selectedFile).subscribe({
        next: r => persist(r.url),
        error: err => { console.error(err); persist(); }
      });
    } else {
      persist();
    }

  }

  // Delete (simple confirm)
  showDeleteModal = false;
  rowToDelete: Product | null = null;
  askDelete(row: Product) { this.rowToDelete = row; this.showDeleteModal = true; }
  confirmDelete() {
    if (!this.rowToDelete) { this.showDeleteModal = false; return; }
    const id = this.rowToDelete.id;
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        console.log("Product deleted:", id);
        this.rowData = this.rowData.filter(r => r.id !== this.rowToDelete!.id);
        this.gridApi?.setGridOption('rowData', this.rowData);
      },
      error: (err) => {
        console.error("Error deleting product:", err);
      }
    });

    this.rowToDelete = null;
    this.showDeleteModal = false;
  }

  // Upload
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
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }
}