import { Component, NgZone, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  GetRowIdParams
} from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { MainCategory } from '../../../models/nav-models/main-category';
import { MainCategoryService } from '../../../common/services/main-category-service.service';

ModuleRegistry.registerModules([AllCommunityModule]);

type MainCategoryRow = MainCategory & { __tempId?: number };

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

  rowData: MainCategoryRow[] = [];
  gridApi!: GridApi<MainCategoryRow>;
  private tempIdCounter = -1;
  saving = false;

  defaultColDef: ColDef<MainCategoryRow> = {
    resizable: true,
    sortable: true,
    filter: true,
    minWidth: 120
  };

  columnDefs: ColDef<MainCategoryRow>[] = [
    { headerName: 'ID', field: 'id', maxWidth: 90, filter: 'agNumberColumnFilter' },
    { headerName: 'Name', field: 'name', minWidth: 160, flex: 1 },
    { headerName: 'Description', field: 'description', minWidth: 200, flex: 1 },
    {
      headerName: 'Action',
      maxWidth: 200,
      sortable: false,
      filter: false,
      cellRenderer: (p: ICellRendererParams<MainCategoryRow>) => this.actionsRenderer(p),
    },
  ];

  getRowId = (p: GetRowIdParams<MainCategoryRow>): string => {
    const d = p.data;
    if (!d) return '';
    if (d.id != null && d.id > 0) return String(d.id);
    if (d.__tempId == null) d.__tempId = this.tempIdCounter--;
    return 'tmp' + d.__tempId;
  };

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(showGridOverlay: boolean = false): void {
    if (showGridOverlay && this.gridApi) {
      this.gridApi.showLoadingOverlay();
    }
    this.mainCategoryService.getMainCategories().subscribe({
      next: data => {
        const cleaned = (data || [])
          .filter((r): r is MainCategory => !!r)
          .map(r => (r.id == null || r.id <= 0) ? { ...r, __tempId: this.tempIdCounter-- } : r);
        this.rowData = cleaned;
        if (this.gridApi) {
          this.gridApi.setGridOption('rowData', this.rowData);
          this.gridApi.hideOverlay();
        }
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('[refreshAll] error', err);
        if (this.gridApi) this.gridApi.hideOverlay();
      }
    });
  }

  private actionsRenderer = (p: ICellRendererParams<MainCategoryRow>) => {
    const wrap = document.createElement('div');
    wrap.className = 'dk-actions';

    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn btn-sm btn-outline-secondary';
    edit.textContent = 'Edit';
    edit.addEventListener('click', ev => {
      ev.stopPropagation();
      this.ngZone.run(() => this.openEditModal(p.data!));
    });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn btn-sm btn-outline-danger';
    del.textContent = 'Delete';
    del.addEventListener('click', ev => {
      ev.stopPropagation();
      this.ngZone.run(() => this.askDelete(p.data!));
    });

    wrap.append(edit, del);
    return wrap;
  };

  onGridReady(e: GridReadyEvent<MainCategoryRow>) {
    this.gridApi = e.api;
    this.gridApi.setGridOption('pagination', true);
    this.gridApi.setGridOption('paginationPageSize', 10);
    setTimeout(() => this.gridApi.sizeColumnsToFit(), 0);
  }

  onPageSizeChange(ev: Event) {
    const size = +(ev.target as HTMLSelectElement).value;
    this.gridApi?.setGridOption('paginationPageSize', size);
  }

  // Modal / form state
  showFormModal = false;
  isEditForm = false;
  form: Partial<MainCategoryRow> = {};
  previewUrl: string | null = null;
  selectedFile: File | null = null;

  openAddModal() {
    this.isEditForm = false;
    this.form = { name: '', description: '', imageUrl: '' };
    this.resetPreview();
    this.showFormModal = true;
  }

  openEditModal(row: MainCategoryRow) {
    this.isEditForm = true;
    this.form = { ...row };
    this.resetPreview();
    this.showFormModal = true;
  }

  closeFormModal() {
    this.showFormModal = false;
    this.resetPreview();
    this.selectedFile = null;
    this.saving = false;
    this.cdr.markForCheck();
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
    if (this.saving) return;
    const name = (this.form.name || '').trim();
    if (!name) return;

    this.saving = true;
    this.cdr.markForCheck();

    const finalize = () => {
      this.saving = false;
      this.cdr.markForCheck();
    };

    const persist = (imageUrl?: string) => {
      if (imageUrl) this.form.imageUrl = imageUrl;

      if (this.isEditForm && this.form.id && this.form.id > 0) {
        const payload: MainCategory = {
          id: this.form.id,
          name,
          description: this.form.description || '',
          imageUrl: this.form.imageUrl || '',
          categories: []
        };
        this.mainCategoryService.updateMainCategory(payload.id, payload).subscribe({
          next: res => {
            if (!res || res.id == null) {
              console.warn('[update] invalid response; full refresh');
            }
            this.ngZone.run(() => {
              this.closeFormModal();
              this.refreshAll(true); // always re-fetch latest
            });
          },
          error: err => {
            console.error('[updateMainCategory] error', err);
          },
          complete: finalize
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
            if (!res || res.id == null || res.id <= 0) {
              console.warn('[addMainCategory] invalid response; full refresh');
            }
            this.ngZone.run(() => {
              this.closeFormModal();
              this.refreshAll(true);
            });
          },
          error: err => {
            console.error('[addMainCategory] error', err);
          },
          complete: finalize
        });
      }
    };

    if (this.selectedFile) {
      this.mainCategoryService.uploadBlob(this.selectedFile).subscribe({
        next: r => persist(r?.url),
        error: err => {
          console.error('[uploadBlob] error', err);
          persist();
        }
      });
    } else {
      persist();
    }
  }

  // Delete
  showDeleteModal = false;
  rowToDelete: MainCategoryRow | null = null;

  askDelete(row: MainCategoryRow) {
    this.rowToDelete = row;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.rowToDelete) { this.showDeleteModal = false; return; }
    const deleting = this.rowToDelete;
    this.mainCategoryService.deleteMainCategory(deleting.id).subscribe({
      next: () => {
        // Simpler: full refresh to stay consistent
        this.refreshAll(true);
      },
      error: err => console.error('[deleteMainCategory] error', err),
      complete: () => {
        this.rowToDelete = null;
        this.showDeleteModal = false;
        this.cdr.markForCheck();
      }
    });
  }

  private resetPreview() {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }
}
