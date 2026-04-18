import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, finalize, takeUntil, timeout } from 'rxjs/operators';
import {
  AdminManagedUserListItem,
  AdminManagedUserRole,
  CreateAdminManagedUserPayload,
  UpdateAdminManagedUserPayload,
} from '../../types';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-users-list',
  standalone: false,
  templateUrl: './admin-users-list.component.html',
  styleUrls: ['./admin-users-list.component.scss'],
})
export class AdminUsersListComponent implements OnInit, OnDestroy {
  users: AdminManagedUserListItem[] = [];
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  page = 1;
  limit = 20;
  total = 0;
  totalPages = 1;

  filterRole: AdminManagedUserRole | 'all' = 'all';
  filterStatus: 'active' | 'blocked' | 'pending' | 'all' = 'all';
  filterSearch = '';

  showCreateModal = false;
  showEditModal = false;
  editingUser: AdminManagedUserListItem | null = null;

  createPayload: CreateAdminManagedUserPayload = {
    email: '',
    fullName: '',
    role: 'Professor',
    isActive: true,
    sendInvite: true,
  };

  editPayload: UpdateAdminManagedUserPayload = {
    fullName: '',
    role: 'Professor',
    isActive: true,
    reason: '',
  };

  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  constructor(
    private api: ApiService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadUsers();
      });

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(): void {
    this.search$.next(this.filterSearch);
  }

  applyFilters(): void {
    this.page = 1;
    this.loadUsers();
  }

  goToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  loadUsers(): void {
    this.setLoadingState(true);
    this.errorMessage = '';

    this.api
      .listAdminUsers({
        page: this.page,
        limit: this.limit,
        role: this.filterRole,
        status: this.filterStatus,
        search: this.filterSearch.trim() || undefined,
      })
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$),
        finalize(() => this.setLoadingState(false))
      )
      .subscribe({
        next: (res) => {
          this.users = res.users || [];
          this.total = res.pagination?.total || 0;
          this.totalPages = res.pagination?.totalPages || 1;
          this.page = res.pagination?.page || this.page;
          this.limit = res.pagination?.limit || this.limit;
          this.refreshView();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || 'Erro ao carregar usuários.';
          this.users = [];
          this.refreshView();
        },
      });
  }

  previousPage(): void {
    if (this.page <= 1 || this.isLoading) {
      return;
    }
    this.page -= 1;
    this.loadUsers();
  }

  nextPage(): void {
    if (this.page >= this.totalPages || this.isLoading) {
      return;
    }
    this.page += 1;
    this.loadUsers();
  }

  openCreateModal(): void {
    this.createPayload = {
      email: '',
      fullName: '',
      role: 'Professor',
      isActive: true,
      sendInvite: true,
    };
    this.showCreateModal = true;
  }

  submitCreate(): void {
    if (!this.createPayload.email || !this.createPayload.fullName) {
      this.errorMessage = 'Preencha nome e email para criar usuário.';
      return;
    }

    this.setSubmittingState(true);
    this.errorMessage = '';

    this.api
      .createAdminManagedUser(this.createPayload)
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$),
        finalize(() => this.setSubmittingState(false))
      )
      .subscribe({
        next: (res) => {
          this.successMessage = res.message || 'Usuário criado com sucesso.';
          this.showCreateModal = false;
          this.loadUsers();
          this.refreshView();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || 'Erro ao criar usuário.';
          this.refreshView();
        },
      });
  }

  openEditModal(user: AdminManagedUserListItem): void {
    this.editingUser = user;
    this.editPayload = {
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      reason: '',
    };
    this.showEditModal = true;
  }

  submitEdit(): void {
    if (!this.editingUser) {
      return;
    }

    this.setSubmittingState(true);
    this.errorMessage = '';

    this.api
      .updateAdminManagedUser(this.editingUser.id, this.editPayload)
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$),
        finalize(() => this.setSubmittingState(false))
      )
      .subscribe({
        next: (res) => {
          this.successMessage = res.message || 'Usuário atualizado com sucesso.';
          this.showEditModal = false;
          this.editingUser = null;
          this.loadUsers();
          this.refreshView();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || 'Erro ao atualizar usuário.';
          this.refreshView();
        },
      });
  }

  toggleStatus(user: AdminManagedUserListItem): void {
    const targetStatus = user.isActive ? 'bloquear' : 'desbloquear';
    const reason = window.prompt(`Informe o motivo para ${targetStatus} este usuário (opcional):`, '') || '';

    this.api
      .updateAdminManagedUser(user.id, {
        isActive: !user.isActive,
        reason,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.successMessage = res.message;
          this.loadUsers();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || 'Erro ao atualizar status do usuário.';
        },
      });
  }

  softDelete(user: AdminManagedUserListItem): void {
    const confirmed = window.confirm(
      `Soft delete de ${user.fullName}: dados históricos serão preservados. Confirmar?`
    );
    if (!confirmed) {
      return;
    }

    const reason = window.prompt('Motivo da remoção lógica (opcional):', '') || '';

    this.api
      .deleteAdminManagedUser(user.id, { reason })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.successMessage = res.message;
          this.loadUsers();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || 'Erro ao remover usuário.';
        },
      });
  }

  exportCsv(): void {
    this.api
      .exportAdminUsersCsv({
        role: this.filterRole,
        status: this.filterStatus,
        search: this.filterSearch.trim() || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const contentDisposition = res.headers.get('content-disposition') || '';
          const fileNameMatch = /filename="?([^\"]+)"?/i.exec(contentDisposition);
          const fileName = fileNameMatch?.[1] || 'usuarios.csv';
          const blob = res.body || new Blob([], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = fileName;
          anchor.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || 'Erro ao exportar CSV de usuários.';
        },
      });
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.editingUser = null;
    this.setSubmittingState(false);
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }

  private setSubmittingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isSubmitting = value;
      this.cdr.detectChanges();
    });
  }

  private refreshView(): void {
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
  }

  formatRole(role: AdminManagedUserRole): string {
    if (role === 'Responsavel') {
      return 'Responsável';
    }
    return role;
  }

  formatStatus(status: AdminManagedUserListItem['status']): string {
    if (status === 'blocked') {
      return 'Bloqueado';
    }
    if (status === 'pending') {
      return 'Pendente';
    }
    return 'Ativo';
  }
}
