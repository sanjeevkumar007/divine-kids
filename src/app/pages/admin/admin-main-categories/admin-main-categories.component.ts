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
import { of } from 'rxjs';
import { switchMap, map, catchError, finalize } from 'rxjs/operators';

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

  // Global saving + loading
  saving = false;
  savingMessage = '';
  loading = false;

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
    // Initial load (non-forced)
    this.loadMainCategories(false);
  }

  // OLD refreshAll kept (not used now) – consider removing later to avoid confusion
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

  onGridReady(e: GridReadyEvent<MainCategoryRow>) {
    this.gridApi = e.api;
    this.gridApi.setGridOption('pagination', true);
    this.gridApi.setGridOption('paginationPageSize', 10);
    setTimeout(() => this.gridApi.sizeColumnsToFit(), 0);
    // Ensure a fresh load when grid becomes ready
    this.loadMainCategories(false);
  }

  loadMainCategories(forceRefresh = false, after?: () => void) {
    this.loading = true;
    this.gridApi?.showLoadingOverlay();

    this.mainCategoryService.getMainCategories(forceRefresh)
      .pipe(finalize(() => {
        this.loading = false;
        after?.();
      }))
      .subscribe({
        next: data => {
          this.rowData = data;
          if (!data.length) this.gridApi?.showNoRowsOverlay(); else this.gridApi?.hideOverlay();
          this.gridApi?.setGridOption('rowData', this.rowData);
          this.cdr.markForCheck(); // ensure UI updates
        },
        error: err => {
          console.error('Failed to load main categories', err);
          this.gridApi?.hideOverlay();
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

  closeFormModal(force = false) {
    if (this.saving && !force) return;
    this.showFormModal = false;
    this.resetPreview();
    this.selectedFile = null;
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
    this.savingMessage = this.isEditForm ? 'Updating main category...' : 'Creating main category...';
    this.closeFormModal(true);

    const upload$ = this.selectedFile
      ? this.mainCategoryService.uploadBlob(this.selectedFile).pipe(
        map(r => r?.url as string | undefined),
        catchError(err => {
          console.error('[uploadBlob] error', err);
          return of(undefined);
        })
      )
      : of(undefined);

    upload$
      .pipe(
        switchMap(imageUrl => {
          if (imageUrl) this.form.imageUrl = imageUrl;

          const payload: MainCategory = {
            id: this.isEditForm && this.form.id ? this.form.id : 0,
            name,
            description: this.form.description || '',
            imageUrl: this.form.imageUrl || '',
            categories: []
          };

          return (payload.id > 0
            ? this.mainCategoryService.updateMainCategory(payload.id, payload)
            : this.mainCategoryService.addMainCategory(payload)
          ).pipe(map(res => ({ res, isUpdate: payload.id > 0 })));
        }),
        finalize(() => {
          this.saving = false;
          this.savingMessage = '';
          if (this.previewUrl) {
            try { URL.revokeObjectURL(this.previewUrl); } catch { }
          }
          this.previewUrl = null;
          this.selectedFile = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: ({ res, isUpdate }) => {
          // Force fresh server fetch (bypass cache)
          this.loadMainCategories(true);
        },
        error: err => {
          console.error('[saveMainCategory] error', err);
        }
      });
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
    this.showDeleteModal = false;
    this.rowToDelete = null;

    this.mainCategoryService.deleteMainCategory(deleting.id).subscribe({
      next: () => this.loadMainCategories(true),
      error: err => console.error('[deleteMainCategory] error', err),
      complete: () => this.cdr.markForCheck()
    });
  }

  private resetPreview() {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }
}
