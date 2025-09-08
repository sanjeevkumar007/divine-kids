import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridApi, GridReadyEvent, ICellRendererParams, CellClickedEvent } from 'ag-grid-community';
import { CategoryService } from '../../../common/services/category-service.service';
import { Category } from '../../../models/nav-models/category';
import { MainCategory } from '../../../models/nav-models/main-category';
import { MainCategoryService } from '../../../common/services/main-category-service.service';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { environment } from '../../../../environments/environment.development';
ModuleRegistry.registerModules([AllCommunityModule]);
type Status = 'Active' | 'Inactive';
const apiBaseUrl = environment.apiUrl;

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './admin-categories.component.html',
  styleUrls: ['./admin-categories.component.css'],
})
export class AdminCategoriesComponent implements OnInit {

  private categoryServices = inject(CategoryService);
  private mainCategoryService = inject(MainCategoryService);
  // Seed data
  rowData: Category[] = [
  ];

  mainCategories: MainCategory[] = [];

  ngOnInit(): void {
    this.categoryServices.getCategories().subscribe(data => {
      this.rowData = data;
    });

    this.mainCategoryService.getMainCategories().subscribe(data => {
      this.mainCategories = data;
    });

  }

  // Grid
  gridApi!: GridApi<Category>;
  columnDefs: ColDef<Category>[] = [
    { headerName: 'ID', field: 'id', maxWidth: 90, sortable: true, filter: 'agNumberColumnFilter' },
    // {
    //   headerName: 'Image',
    //   field: 'imageUrl',
    //   maxWidth: 110,
    //   filter: false,
    //   cellRenderer: (p: ICellRendererParams<Category>) => {
    //     const wrap = document.createElement('div');
    //     wrap.style.display = 'grid';
    //     wrap.style.placeItems = 'center';
    //     const img = document.createElement('img');
    //     img.src = p.value || '';
    //     img.alt = p.data?.name || '';
    //     img.width = 40; img.height = 40;
    //     img.style.objectFit = 'cover';
    //     img.style.borderRadius = '8px';
    //     img.style.border = '1px solid rgba(0,0,0,.15)';
    //     wrap.appendChild(img);
    //     return wrap;
    //   },
    // },
    { headerName: 'Name', field: 'name', sortable: true, filter: true, minWidth: 160, flex: 1 },
    { headerName: 'Description', field: 'description', sortable: true, filter: true, minWidth: 200, flex: 1 },
    // {
    //   headerName: 'Status',
    //   field: 'status',
    //   maxWidth: 140,
    //   filter: 'agSetColumnFilter',
    // },
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
  defaultColDef: ColDef<Category> = { resizable: true, sortable: true, filter: true, minWidth: 120 };

  onGridReady(e: GridReadyEvent<Category>) {
    this.gridApi = e.api;
    // Delegate Action button clicks
    this.gridApi.addEventListener('cellClicked', (evt: CellClickedEvent<Category>) => {
      if (evt.colDef?.headerName !== 'Action') return;
      const btn = (evt.event?.target as HTMLElement)?.closest('button[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (action === 'edit') this.openEditModal(evt.data as Category);
      if (action === 'delete') this.askDelete(evt.data as Category);
    });
    setTimeout(() => this.gridApi.sizeColumnsToFit(), 0);
  }

  // Modal state
  showFormModal = false;
  isEditForm = false;
  form: Partial<Category> = {};
  previewUrl: string | null = null;

  openAddModal() {
    this.isEditForm = false;
    this.form = { name: '', description: '', imageUrl: '' };
    this.resetPreview();
    this.showFormModal = true;
  }

  openEditModal(row: Category) {
    this.isEditForm = true;
    this.form = { ...row };
    this.resetPreview();
    this.showFormModal = true;
  }

  closeFormModal() {
    this.showFormModal = false;
    this.resetPreview();
  }

  saveCategory(ev: Event) {
    ev.preventDefault();
    const name = (this.form.name || '').trim();
    if (!name) return;

    if (this.isEditForm && this.form.id != null) {
      this.rowData = this.rowData.map(r => r.id === this.form.id ? { ...r, ...(this.form as Category) } : r);

      this.categoryServices.updateCategory(this.form.id, this.form as Category).subscribe({
        next: (data) => {
          console.log("Category updated:", data);
        },
        error: (err) => {
          console.error("Error updating category:", err);
        }
      });
    } else {
      const nextId = (this.rowData.reduce((m, r) => Math.max(m, r.id), 0) || 0) + 1;
      const cat: Category = {
        id: nextId,
        name,
        description: this.form.description || '',
        imageUrl: this.form.imageUrl || '',
        mainCategoryId: this.form.mainCategoryId || 0,
        products: [],
      };
      this.rowData = [cat, ...this.rowData];
      this.categoryServices.addCategory(cat).subscribe({
        next: (data) => {
          console.log("Category added:", data);
        }, error: (err) => {
          console.error("Error adding category:", err);
        }
      });
    }

    this.gridApi?.setGridOption('rowData', this.rowData);
    this.closeFormModal();
  }

  // Delete confirm
  showDeleteModal = false;
  rowToDelete: Category | null = null;
  askDelete(row: Category) { this.rowToDelete = row; this.showDeleteModal = true; }
  confirmDelete() {
    if (!this.rowToDelete) { this.showDeleteModal = false; return; }
    this.rowData = this.rowData.filter(r => r.id !== this.rowToDelete!.id);
    this.gridApi?.setGridOption('rowData', this.rowData);
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
  }

  private resetPreview() {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }
}