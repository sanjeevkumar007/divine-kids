import { Component, NgZone, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridApi, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import { MainCategory } from '../../../models/nav-models/main-category';
import { MainCategoryService } from '../../../common/services/main-category-service.service';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  standalone: true,
  selector: 'app-admin-main-categories',
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './admin-main-categories.component.html',
  styleUrls: ['./admin-main-categories.component.css'],
})
export class AdminMainCategoriesComponent implements OnInit {
  private mainCategoryService = inject(MainCategoryService);
  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) { }

  rowData: MainCategory[] = [];
  gridApi!: GridApi<MainCategory>;

  defaultColDef: ColDef<MainCategory> = { resizable: true, sortable: true, filter: true, minWidth: 120 };
  columnDefs: ColDef<MainCategory>[] = [
    { headerName: 'ID', field: 'id', maxWidth: 90, filter: 'agNumberColumnFilter' },
    { headerName: 'Name', field: 'name', minWidth: 160, flex: 1 },
    { headerName: 'Description', field: 'description', minWidth: 200, flex: 1 },
    {
      headerName: 'Action',
      maxWidth: 200,
      sortable: false,
      filter: false,
      cellRenderer: (p: ICellRendererParams<MainCategory>) => this.actionsRenderer(p),
    },
  ];

  ngOnInit(): void {
    this.mainCategoryService.getMainCategories().subscribe(data => {
      this.rowData = data;
      this.gridApi?.setGridOption('rowData', this.rowData);
      this.cdr.markForCheck();
    });
  }

  private actionsRenderer = (p: ICellRendererParams<MainCategory>) => {
    const wrap = document.createElement('div');
    wrap.className = 'dk-actions';

    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn btn-sm btn-outline-secondary';
    edit.textContent = 'Edit';
    edit.addEventListener('click', ev => {
      ev.stopPropagation();
      this.ngZone.run(() => { this.openEditModal(p.data!); });
    });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn btn-sm btn-outline-danger';
    del.textContent = 'Delete';
    del.addEventListener('click', ev => {
      ev.stopPropagation();
      this.ngZone.run(() => { this.askDelete(p.data!); });
    });

    wrap.append(edit, del);
    return wrap;
  };

  onGridReady(e: GridReadyEvent<MainCategory>) {
    this.gridApi = e.api;
    this.gridApi.setGridOption('pagination', true);
    this.gridApi.setGridOption('paginationPageSize', 10);
    setTimeout(() => this.gridApi.sizeColumnsToFit(), 0);
  }
  onPageSizeChange(ev: Event) {
    const size = +(ev.target as HTMLSelectElement).value;
    this.gridApi?.setGridOption('paginationPageSize', size);
  }

  // Modal state
  showFormModal = false;
  isEditForm = false;
  form: Partial<MainCategory> = {};
  previewUrl: string | null = null;
  selectedFile: File | null = null;

  openAddModal() {
    this.isEditForm = false;
    this.form = { name: '', description: '', imageUrl: '' };
    this.resetPreview();
    this.showFormModal = true;
  }
  openEditModal(row: MainCategory) {
    this.isEditForm = true;
    this.form = { ...row };
    this.resetPreview();
    this.showFormModal = true;
  }
  closeFormModal() {
    this.showFormModal = false;
    this.resetPreview();
    this.selectedFile = null;
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Max 2 MB'); input.value = ''; return; }
    this.resetPreview();
    this.previewUrl = URL.createObjectURL(file);
    this.selectedFile = file;
  }

  saveMainCategory(ev: Event) {
    ev.preventDefault();
    const name = (this.form.name || '').trim();
    if (!name) return;

    const persist = (imageUrl?: string) => {
      if (imageUrl) this.form.imageUrl = imageUrl;

      if (this.isEditForm && this.form.id != null) {
        const idx = this.rowData.findIndex(r => r.id === this.form.id);
        if (idx === -1) return;
        const payload: MainCategory = {
          ...this.rowData[idx],
          name,
          description: this.form.description || '',
          imageUrl: this.form.imageUrl || '',
          categories: this.rowData[idx].categories || []
        };
        this.mainCategoryService.updateMainCategory(payload.id, payload).subscribe({
          next: res => {
            this.rowData[idx] = res;
            this.gridApi.setGridOption('rowData', [...this.rowData]);
            this.closeFormModal();
          },
          error: err => console.error(err)
        });
      } else {
        const payload: MainCategory = {
          id: 0,
          name,
          description: this.form.description || '',
          imageUrl: this.form.imageUrl || '',
          categories: []
        };
        this.mainCategoryService.addMainCategory(payload).subscribe({
          next: res => {
            this.rowData = [res, ...this.rowData];
            this.gridApi.setGridOption('rowData', this.rowData);
            this.closeFormModal();
          },
          error: err => console.error(err)
        });
      }

    };

    if (this.selectedFile) {
      this.mainCategoryService.uploadBlob(this.selectedFile).subscribe({
        next: r => persist(r.url),
        error: err => { console.error(err); persist(); }
      });
    } else {
      persist();
    }
  }

  // Delete
  showDeleteModal = false;
  rowToDelete: MainCategory | null = null;
  askDelete(row: MainCategory) { this.rowToDelete = row; this.showDeleteModal = true; }
  confirmDelete() {
    if (!this.rowToDelete) { this.showDeleteModal = false; return; }
    const id = this.rowToDelete.id;
    this.mainCategoryService.deleteMainCategory(id).subscribe({
      next: () => {
        this.rowData = this.rowData.filter(r => r.id !== id);
        this.gridApi.setGridOption('rowData', this.rowData);
      },
      error: err => console.error(err),
      complete: () => {
        this.rowToDelete = null;
        this.showDeleteModal = false;
      }
    });
  }

  private resetPreview() {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }
}