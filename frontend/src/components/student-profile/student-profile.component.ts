import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { GuardianSearchResult, StudentFichaResponse } from '../../types';

@Component({
  selector: 'app-student-profile',
  standalone: false,
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.scss'],
})
export class StudentProfileComponent implements OnInit {
  loading = false;
  loadingGuardianSearch = false;
  loadingLink = false;
  loadingCreateAndLink = false;
  errorMessage = '';
  successMessage = '';
  ficha: StudentFichaResponse | null = null;
  studentId = '';
  searchedGuardian: GuardianSearchResult | null = null;
  searchGuardianEmail = '';
  searchRelationship = '';
  createGuardianForm = {
    email: '',
    fullName: '',
    relationship: '',
    phone: '',
    documentId: '',
    isPrimary: true,
  };
  createdGuardianTemporaryPassword = '';
  private isProfessorView = false;

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('id') || '';
    this.isProfessorView = (this.router.url || '').startsWith('/professores/');

    if (!this.studentId) {
      this.errorMessage = 'Aluno não encontrado';
      return;
    }

    this.loadFicha();
  }

  loadFicha(): void {
    if (!this.studentId) {
      this.errorMessage = 'Aluno não encontrado';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.api.getStudentFicha(this.studentId).subscribe({
      next: (ficha) => {
        this.loading = false;
        this.ficha = ficha;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.error || 'Erro ao carregar ficha do aluno.';
      },
    });
  }

  goBack(): void {
    this.router.navigate([this.isProfessorView ? '/professores/meus-alunos' : '/admin/alunos']);
  }

  canManageHealth(): boolean {
    return !this.isProfessorView;
  }

  goToHealthScreening(): void {
    if (!this.studentId || !this.canManageHealth()) {
      return;
    }

    this.router.navigate(['/health-screening', this.studentId], {
      queryParams: { returnTo: this.router.url || `/admin/alunos/${this.studentId}/ficha` },
    });
  }

  searchGuardian(): void {
    const email = this.searchGuardianEmail.trim().toLowerCase();
    if (!email) {
      this.errorMessage = 'Informe o email do responsável para buscar.';
      return;
    }

    this.loadingGuardianSearch = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.searchedGuardian = null;

    this.api.searchGuardianByEmail(email).subscribe({
      next: (res) => {
        this.loadingGuardianSearch = false;
        this.searchedGuardian = res.guardian;
      },
      error: (error) => {
        this.loadingGuardianSearch = false;
        this.searchedGuardian = null;
        this.errorMessage = error?.error?.error || 'Responsável não encontrado para o email informado.';
      },
    });
  }

  linkExistingGuardian(): void {
    if (!this.studentId || !this.searchedGuardian?.guardianId) {
      this.errorMessage = 'Selecione um responsável para vincular.';
      return;
    }

    this.loadingLink = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.createdGuardianTemporaryPassword = '';

    this.api.linkGuardianToStudent(this.studentId, {
      guardianId: this.searchedGuardian.guardianId,
      relationship: this.searchRelationship.trim() || undefined,
      isPrimary: true,
    }).subscribe({
      next: (res) => {
        this.loadingLink = false;
        this.successMessage = res.message;
        this.searchGuardianEmail = '';
        this.searchRelationship = '';
        this.searchedGuardian = null;
        this.loadFicha();
      },
      error: (error) => {
        this.loadingLink = false;
        this.errorMessage = error?.error?.error || 'Erro ao vincular responsável existente.';
      },
    });
  }

  createAndLinkGuardian(): void {
    if (!this.studentId) {
      this.errorMessage = 'Aluno não encontrado.';
      return;
    }

    const email = this.createGuardianForm.email.trim().toLowerCase();
    const fullName = this.createGuardianForm.fullName.trim();
    if (!email || !fullName) {
      this.errorMessage = 'Preencha nome e email para criar o responsável.';
      return;
    }

    this.loadingCreateAndLink = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.createdGuardianTemporaryPassword = '';

    this.api.createAndLinkGuardian(this.studentId, {
      email,
      fullName,
      relationship: this.createGuardianForm.relationship.trim() || undefined,
      phone: this.createGuardianForm.phone.trim() || undefined,
      documentId: this.createGuardianForm.documentId.trim() || undefined,
      isPrimary: this.createGuardianForm.isPrimary,
    }).subscribe({
      next: (res) => {
        this.loadingCreateAndLink = false;
        this.successMessage = res.message;
        this.createdGuardianTemporaryPassword = res.temporaryPassword || '';
        this.createGuardianForm = {
          email: '',
          fullName: '',
          relationship: '',
          phone: '',
          documentId: '',
          isPrimary: true,
        };
        this.loadFicha();
      },
      error: (error) => {
        this.loadingCreateAndLink = false;
        this.errorMessage = error?.error?.error || 'Erro ao criar e vincular responsável.';
      },
    });
  }

  unlinkGuardian(): void {
    if (!this.studentId || !this.ficha?.responsavel.guardianId) {
      return;
    }

    if (!window.confirm('Deseja desvincular este responsável do aluno?')) {
      return;
    }

    this.loadingLink = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.createdGuardianTemporaryPassword = '';

    this.api.unlinkGuardianFromStudent(this.studentId, this.ficha.responsavel.guardianId).subscribe({
      next: (res) => {
        this.loadingLink = false;
        this.successMessage = res.message;
        this.loadFicha();
      },
      error: (error) => {
        this.loadingLink = false;
        this.errorMessage = error?.error?.error || 'Erro ao desvincular responsável.';
      },
    });
  }

  toDate(value: string | Date | null | undefined): string {
    if (!value) return '-';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
  }

  getHealthStatusLabel(): string {
    return this.ficha?.health.anamnesePreenchida ? 'Anamnese preenchida' : 'Anamnese pendente';
  }
}
