import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ProfessorProfile } from '../../types';

@Component({
  selector: 'app-professors-list',
  standalone: false,
  templateUrl: './professors-list.component.html',
  styleUrls: ['./professors-list.component.scss'],
})
export class ProfessorsListComponent implements OnInit {
  professors: ProfessorProfile[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  filterName = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadProfessors();
  }

  loadProfessors(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api
      .listProfessors({
        name: this.filterName.trim() || undefined,
        status: this.filterStatus,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.professors = res.professors || [];
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.error || 'Erro ao carregar professores.';
          this.professors = [];
        },
      });
  }

  goToNewProfessor(): void {
    this.router.navigate(['/admin/professores/novo']);
  }

  editProfessor(professorId: string): void {
    this.router.navigate(['/admin/professores', professorId, 'editar']);
  }

  toggleStatus(professor: ProfessorProfile): void {
    const shouldActivate = professor.isActive === false;
    const action = shouldActivate ? 'Ativar' : 'Desativar';
    const warning = shouldActivate
      ? `Ativar ${professor.fullName}?`
      : `Desativar ${professor.fullName}? O professor nao conseguira mais fazer login.`;

    if (!window.confirm(warning)) {
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';

    this.api.updateProfessorStatus(professor.id, { isActive: shouldActivate }).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.loadProfessors();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || `Erro ao ${action.toLowerCase()} professor.`;
      },
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  formatDate(value: string | Date | null | undefined): string {
    if (!value) return '-';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
  }
}
