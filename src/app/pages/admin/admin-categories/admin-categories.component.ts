import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridApi, GridReadyEvent, CellClickedEvent } from 'ag-grid-community';
import { CategoryService } from '../../../common/services/category-service.service';
import { Category } from '../../../models/nav-models/category';
import { MainCategory } from '../../../models/nav-models/main-category';
import { MainCategoryService } from '../../../common/services/main-category-service.service';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { finalize } from 'rxjs/operators';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './admin-categories.component.html',
  styleUrls: ['./admin-categories.component.css'],
})
export class AdminCategoriesComponent implements OnInit {

  private categoryServices = inject(CategoryService);
  private mainCategoryService = inject(MainCategoryService);

  rowData: Category[] = [];
  mainCategories: MainCategory[] = [];

  gridApi!: GridApi<Category>;
  loading = false;
  saving = false;
  savingMessage = '';

  columnDefs: ColDef<Category>[] = [
    { headerName: 'ID', field: 'id', maxWidth: 90, sortable: true, filter: 'agNumberColumnFilter' },
    { headerName: 'Name', field: 'name', sortable: true, filter: true, minWidth: 160, flex: 1 },
    { headerName: 'Description', field: 'description', sortable: true, filter: true, minWidth: 200, flex: 1 },
    {
      headerName: 'Action',
      maxWidth: 200,
      sortable: false,
      filter: false,
      cellRenderer: () => `
        <div class="dk-actions">
          <button type="button" style="margin-right:5px;" class="btn btn-sm btn-outline-secondary" data-action="edit">Edit</button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete">Delete</button>
        </div>
      `,
    },
  ];
  defaultColDef: ColDef<Category> = { resizable: true, sortable: true, filter: true, minWidth: 120 };

  ngOnInit(): void {
    this.mainCategoryService.getMainCategories().subscribe(data => {
      this.mainCategories = data;
    });
  }

  onGridReady(e: GridReadyEvent<Category>) {
    this.gridApi = e.api;

    this.gridApi.addEventListener('cellClicked', (evt: CellClickedEvent<Category>) => {
      if (evt.colDef?.headerName !== 'Action') return;
      const btn = (evt.event?.target as HTMLElement)?.closest('button[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (action === 'edit') this.openEditModal(evt.data as Category);
      if (action === 'delete') this.askDelete(evt.data as Category);
    });

    setTimeout(() => this.gridApi.sizeColumnsToFit(), 0);
    this.loadCategories();
  }

  // Accepts optional callback to run after loading completes
  loadCategories(forceRefresh = false, after?: () => void) {
    this.loading = true;
    this.gridApi?.showLoadingOverlay();

    this.categoryServices.getCategories(forceRefresh)
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
          console.error('Failed to load categories', err);
          this.gridApi?.hideOverlay();
        }
      });
  }

  // Modal / form state
  showFormModal = false;
  isEditForm = false;
  form: Partial<Category> = {};
  previewUrl: string | null = null;

  openAddModal() {
    this.isEditForm = false;
    this.form = { name: '', description: '', imageUrl: '', mainCategoryId: undefined };
    this.resetPreview();
    this.showFormModal = true;
  }

  openEditModal(row: Category) {
    this.isEditForm = true;
    this.form = { ...row };
    this.resetPreview();
    this.showFormModal = true;
  }

  // Replace your closeFormModal with a force option:
  closeFormModal(force = false) {
    if (this.saving && !force) return; // keep old behavior unless forcing
    this.showFormModal = false;
    this.resetPreview();
  }

  saveCategory(ev: Event) {
    ev.preventDefault();
    if (this.saving) return;

    const name = (this.form.name || '').trim();
    if (!name) return;

    this.saving = true;
    const isEdit = this.isEditForm && this.form.id != null;

    const request$ = isEdit
      ? this.categoryServices.updateCategory(this.form.id!, this.form as Category)
      : this.categoryServices.addCategory(this.form as Category);

    request$.subscribe({
      next: () => {
        // Close even while saving (force = true)
        this.closeFormModal(true);

        // After successful save force a fresh GET (bypass cache)
        this.loadCategories(true, () => {
          this.saving = false;
        });
      },
      error: err => {
        console.error('Save failed', err);
        this.saving = false;
      }
    });
  }

  // Delete confirm
  showDeleteModal = false;
  rowToDelete: Category | null = null;
  askDelete(row: Category) { this.rowToDelete = row; this.showDeleteModal = true; }
  confirmDelete() {
    if (!this.rowToDelete) { this.showDeleteModal = false; return; }
    const id = this.rowToDelete.id;
    this.showDeleteModal = false;
    this.rowToDelete = null;

    // Optimistic removal
    this.rowData = this.rowData.filter(r => r.id !== id);
    this.gridApi?.setGridOption('rowData', this.rowData);

    this.categoryServices.deleteCategoryById(id).subscribe({
      next: () => this.loadCategories(),
      error: err => console.error('Delete failed', err)
    });
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
