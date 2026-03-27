import { ChangeDetectorRef, Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil, timeout } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { DeletionRequestItem, LinkedStudentItem, ProfessorTurmaItem, RecentTrainingSummary, User } from '../../types';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  linkedStudents: LinkedStudentItem[] = [];
  recentTrainings: RecentTrainingSummary[] = [];
  isLoadingRecentTrainings = false;
  hasRecentTrainingsError = false;
  isStartingTraining = false;
  startTrainingErrorMessage = '';
  showTrainingStarter = false;
  turmasForTraining: ProfessorTurmaItem[] = [];
  selectedTurmaIdForTraining = '';
  isLoadingTurmasForTraining = false;
  trainingStarterError = '';
  trainingSessionDate = '';
  trainingSessionTime = '';
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

  private destroy$ = new Subject<void>();

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isResponsavel()) {
      this.loadLinkedStudents();
    }

    if (this.isProfessor()) {
      this.loadRecentTrainings();
    }
  }

  isResponsavel(): boolean {
    return this.currentUser?.role === 'Responsavel';
  }

  isProfessor(): boolean {
    return this.currentUser?.role === 'Professor';
  }

  isAluno(): boolean {
    return this.currentUser?.role === 'Aluno';
  }

  goToProfessorProfile(): void {
    this.router.navigate(['/professor/meu-perfil']);
  }

  goToProfessorTurmas(): void {
    this.router.navigate(['/professor/turmas']);
  }

  goToCreateProfessorTurma(): void {
    this.router.navigate(['/professor/turmas/nova']);
  }

  goToProfessorTechniques(): void {
    this.router.navigate(['/professor/tecnicas']);
  }

  openTrainingStarter(): void {
    this.ngZone.run(() => {
      this.showTrainingStarter = true;
      this.trainingStarterError = '';
      this.startTrainingErrorMessage = '';
      this.selectedTurmaIdForTraining = '';
      this.turmasForTraining = [];
      this.trainingSessionDate = '';
      this.trainingSessionTime = '';
      this.isLoadingTurmasForTraining = true;
      this.cdr.detectChanges();
    });

    this.api.listProfessorTurmas().pipe(
      timeout(10000),
      takeUntil(this.destroy$),
      finalize(() => this.setLoadingTurmasState(false))
    ).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.turmasForTraining = (response.turmas || []).filter((t: ProfessorTurmaItem) => t.isActive);
          if (this.turmasForTraining.length === 1) {
            this.selectedTurmaIdForTraining = this.turmasForTraining[0].turmaId;
          }
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.trainingStarterError = error?.error?.error || 'Não foi possível carregar as turmas.';
          this.cdr.detectChanges();
        });
      },
    });
  }

  cancelTrainingStarter(): void {
    this.showTrainingStarter = false;
  }

  confirmStartTraining(): void {
    if (!this.selectedTurmaIdForTraining) {
      this.trainingStarterError = 'Selecione uma turma para continuar.';
      return;
    }
    if (this.isStartingTraining) {
      return;
    }

    this.setStartingTrainingState(true);
    this.trainingStarterError = '';

    this.api.startTrainingSession(
      this.selectedTurmaIdForTraining,
      this.trainingSessionDate || undefined,
      this.trainingSessionTime || undefined
    ).pipe(
      timeout(10000),
      takeUntil(this.destroy$),
      finalize(() => this.setStartingTrainingState(false))
    ).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.showTrainingStarter = false;
          this.router.navigate(['/training/session', response.sessionId, 'techniques']);
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.trainingStarterError = error?.error?.error || 'Não foi possível iniciar o treino.';
          this.cdr.detectChanges();
        });
      },
    });
  }

  goToMyProfile(): void {
    this.router.navigate(['/aluno/meu-perfil']);
  }

  goToMyHealthScreening(): void {
    if (!this.currentUser) {
      return;
    }

    this.router.navigate(['/health-screening', this.currentUser.id], {
      queryParams: { returnTo: '/home' },
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  getAcademyLogo(): string {
    return this.currentUser?.academy?.logoUrl || 'assets/default-academy-logo.svg';
  }

  getUserPhoto(): string {
    return this.currentUser?.photoUrl || 'assets/default-user-photo.svg';
  }

  getHomeTitle(): string {
    if (this.isProfessor()) {
      return 'Painel do Professor';
    }
    if (this.isAluno()) {
      return 'Área do Aluno';
    }
    if (this.isResponsavel()) {
      return 'Área do Responsável';
    }
    return 'Painel inicial';
  }

  getHomeSubtitle(): string {
    if (this.isProfessor()) {
      return 'Acompanhe seus treinos, organize turmas e acesse o histórico recente em um só lugar.';
    }
    if (this.isAluno()) {
      return 'Atualize seu cadastro, revise sua anamnese e acompanhe as próximas ações do seu perfil.';
    }
    if (this.isResponsavel()) {
      return 'Gerencie pendências de saúde e acompanhe solicitações LGPD dos alunos vinculados.';
    }
    return 'Consulte os recursos disponíveis para o seu perfil.';
  }

  goToTrainingHistory(): void {
    this.router.navigate(['/training/history']);
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

  loadRecentTrainings(): void {
    this.isLoadingRecentTrainings = true;
    this.hasRecentTrainingsError = false;
    this.api.getRecentTrainings(3)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.isLoadingRecentTrainings = false;
            this.recentTrainings = response.trainings || [];
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.isLoadingRecentTrainings = false;
            this.hasRecentTrainingsError = true;
            this.recentTrainings = [];
            this.cdr.detectChanges();
          });
        },
      });
  }

  formatTrainingDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
  }

  private setStartingTrainingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isStartingTraining = value;
      this.cdr.detectChanges();
    });
  }

  private setLoadingTurmasState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoadingTurmasForTraining = value;
      this.cdr.detectChanges();
    });
  }

}

