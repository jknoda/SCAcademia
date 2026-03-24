import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { DeletionRequestItem, LinkedStudentItem, User } from '../../types';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  currentUser: User | null = null;
  linkedStudents: LinkedStudentItem[] = [];
  selectedStudentId = '';
  deletionReason = '';
  confirmDeletionRequest = false;
  deletionStatus: DeletionRequestItem | null = null;
  deletionSuccessMessage = '';
  deletionErrorMessage = '';
  linkedStudentsErrorMessage = '';
  isSubmittingDeletion = false;
  isLoadingStatus = false;
  isLoadingLinkedStudents = false;

  constructor(private auth: AuthService, private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isResponsavel()) {
      this.loadLinkedStudents();
    }
  }

  isResponsavel(): boolean {
    return this.currentUser?.role === 'Responsavel';
  }

  isProfessor(): boolean {
    return this.currentUser?.role === 'Professor';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getRoleLabel(): string {
    const roleMap: Record<string, string> = {
      Admin: 'Administrador',
      Professor: 'Professor',
      Aluno: 'Aluno',
      Responsavel: 'Responsável',
    };
    return this.currentUser ? (roleMap[this.currentUser.role] ?? this.currentUser.role) : '';
  }

  private getApiError(error: any, fallback: string): string {
    return error?.error?.error || error?.error?.message || fallback;
  }

  loadLinkedStudents(): void {
    this.isLoadingLinkedStudents = true;
    this.linkedStudentsErrorMessage = '';

    this.api.listLinkedStudents().subscribe({
      next: (response) => {
        this.isLoadingLinkedStudents = false;
        this.linkedStudents = response.students || [];
        if (this.linkedStudents.length > 0 && !this.selectedStudentId) {
          this.selectedStudentId = this.linkedStudents[0].studentId;
        }
      },
      error: (error) => {
        this.isLoadingLinkedStudents = false;
        this.linkedStudents = [];
        this.linkedStudentsErrorMessage = this.getApiError(error, 'Nao foi possivel carregar filhos vinculados.');
      },
    });
  }

  get studentsWithoutHealthScreening(): LinkedStudentItem[] {
    return this.linkedStudents.filter((student) => !student.hasHealthScreening);
  }

  goToStudentHealthScreening(studentId: string): void {
    this.router.navigate(['/health-screening', studentId], {
      queryParams: { returnTo: '/home' },
    });
  }

  get selectedStudentName(): string {
    return this.linkedStudents.find((student) => student.studentId === this.selectedStudentId)?.studentName || 'o aluno selecionado';
  }

  requestDeletion(): void {
    if (!this.selectedStudentId) {
      this.deletionErrorMessage = 'Selecione um filho vinculado para solicitar a delecao.';
      this.deletionSuccessMessage = '';
      return;
    }
    if (!this.confirmDeletionRequest) {
      this.deletionErrorMessage = 'Confirme que entende o impacto da exclusão.';
      this.deletionSuccessMessage = '';
      return;
    }

    this.deletionErrorMessage = '';
    this.deletionSuccessMessage = '';
    this.isSubmittingDeletion = true;

    this.api
      .requestStudentDeletion(this.selectedStudentId, this.deletionReason.trim())
      .subscribe({
        next: (response) => {
          this.deletionStatus = response.request;
          this.deletionSuccessMessage = response.message;
          this.deletionReason = '';
          this.confirmDeletionRequest = false;
          this.isSubmittingDeletion = false;
        },
        error: (error) => {
          this.deletionErrorMessage = this.getApiError(error, 'Nao foi possivel registrar a solicitacao.');
          this.isSubmittingDeletion = false;
        },
      });
  }

  loadDeletionStatus(): void {
    if (!this.selectedStudentId) {
      this.deletionErrorMessage = 'Selecione um filho vinculado para consultar o status.';
      this.deletionSuccessMessage = '';
      return;
    }

    this.deletionErrorMessage = '';
    this.deletionSuccessMessage = '';
    this.isLoadingStatus = true;

    this.api.getStudentDeletionStatus(this.selectedStudentId).subscribe({
      next: (response) => {
        this.deletionStatus = response.request;
        this.isLoadingStatus = false;
      },
      error: (error) => {
        this.deletionStatus = null;
        this.deletionErrorMessage = this.getApiError(error, 'Nao foi possivel consultar o status.');
        this.isLoadingStatus = false;
      },
    });
  }
}
