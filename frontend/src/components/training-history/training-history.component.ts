import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import {
  TrainingHistoryFilters,
  TrainingHistoryItem,
  TrainingDetailsResponse,
} from '../../types';

@Component({
  selector: 'app-training-history',
  standalone: false,
  templateUrl: './training-history.component.html',
  styleUrls: ['./training-history.component.scss'],
})
export class TrainingHistoryComponent implements OnInit, OnDestroy {
  trainings: TrainingHistoryItem[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  isLoading = false;
  isStartingTraining = false;
  errorMessage = '';
  successMessage = '';

  // Filters
  filters: TrainingHistoryFilters = {};
  filterKeyword = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterTurmaId = '';

  // Detail panel
  selectedTraining: TrainingDetailsResponse | null = null;
  isLoadingDetail = false;
  detailError = '';

  // Edit modal
  showEditModal = false;
  editNotes = '';
  isSavingEdit = false;
  editError = '';

  // Delete modal
  showDeleteModal = false;
  isDeletingSession = false;
  deleteError = '';
  deletedSessionId = '';
  undoDeadline: Date | null = null;
  undoCountdown = 0;
  private undoTimer: ReturnType<typeof setInterval> | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.undoTimer) clearInterval(this.undoTimer);
  }

  loadHistory(resetPage = false): void {
    if (resetPage) this.page = 1;
    this.setLoadingState(true);
    this.errorMessage = '';

    const filters: TrainingHistoryFilters = {};
    if (this.filterKeyword) filters.keyword = this.filterKeyword;
    if (this.filterDateFrom) filters.dateFrom = this.filterDateFrom;
    if (this.filterDateTo) filters.dateTo = this.filterDateTo;
    if (this.filterTurmaId) filters.turmaId = this.filterTurmaId;

    const offset = (this.page - 1) * this.pageSize;

    this.api
      .getTrainingHistory(filters, this.pageSize, offset)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.trainings = res.data.trainings;
          this.total = res.data.total;
          this.setLoadingState(false);
        },
        error: () => {
          this.errorMessage = 'Erro ao carregar histórico de treinos.';
          this.setLoadingState(false);
        },
      });
  }

  applyFilters(): void {
    this.loadHistory(true);
  }

  clearFilters(): void {
    this.filterKeyword = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterTurmaId = '';
    this.loadHistory(true);
  }

  backToHome(): void {
    this.router.navigate(['/home']);
  }

  goToTrainingEntry(): void {
    this.router.navigate(['/training/entry-point']);
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadHistory();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadHistory();
    }
  }

  viewDetails(sessionId: string): void {
    this.setDetailState({
      selectedTraining: null,
      detailError: '',
      isLoadingDetail: true,
    });

    this.api
      .getTrainingDetails(sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.setDetailState({
            selectedTraining: res.data,
            detailError: '',
            isLoadingDetail: false,
          });
        },
        error: () => {
          this.setDetailState({
            selectedTraining: null,
            detailError: 'Erro ao carregar detalhes do treino.',
            isLoadingDetail: false,
          });
        },
      });
  }

  closeDetail(): void {
    this.setDetailState({
      selectedTraining: null,
      detailError: '',
      isLoadingDetail: false,
    });
  }

  openEditModal(): void {
    if (!this.selectedTraining) return;
    this.editNotes = this.selectedTraining.notes || '';
    this.editError = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editError = '';
  }

  saveEdit(): void {
    if (!this.selectedTraining) return;
    if (!this.editNotes.trim()) {
      this.editError = 'Observações não podem estar vazias.';
      return;
    }

    this.isSavingEdit = true;
    this.editError = '';

    this.api
      .updateTraining(this.selectedTraining.session_id, { notes: this.editNotes.trim() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSavingEdit = false;
          this.showEditModal = false;
          this.successMessage = 'Observações atualizadas com sucesso!';
          this.viewDetails(this.selectedTraining!.session_id);
          this.loadHistory();
          setTimeout(() => (this.successMessage = ''), 4000);
        },
        error: () => {
          this.isSavingEdit = false;
          this.editError = 'Erro ao salvar observações. Tente novamente.';
        },
      });
  }

  openDeleteModal(): void {
    if (!this.selectedTraining) return;
    this.deleteError = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (!this.selectedTraining) return;
    this.isDeletingSession = true;
    this.deleteError = '';

    const sessionId = this.selectedTraining.session_id;

    this.api
      .deleteTraining(sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isDeletingSession = false;
          this.showDeleteModal = false;
          this.closeDetail();
          this.deletedSessionId = sessionId;
          this.undoDeadline = new Date(res.data.undo_deadline);
          this.startUndoCountdown();
          this.loadHistory();
          this.successMessage = 'Treino excluído. Você pode desfazer nos próximos segundos.';
        },
        error: () => {
          this.isDeletingSession = false;
          this.deleteError = 'Erro ao excluir treino. Tente novamente.';
        },
      });
  }

  private startUndoCountdown(): void {
    if (this.undoTimer) clearInterval(this.undoTimer);
    this.updateUndoCountdown();
    this.undoTimer = setInterval(() => {
      this.updateUndoCountdown();
      if (this.undoCountdown <= 0) {
        clearInterval(this.undoTimer!);
        this.undoTimer = null;
        this.deletedSessionId = '';
        this.undoDeadline = null;
        this.successMessage = '';
      }
    }, 1000);
  }

  private updateUndoCountdown(): void {
    if (!this.undoDeadline) {
      this.undoCountdown = 0;
      return;
    }
    const remaining = Math.floor((this.undoDeadline.getTime() - Date.now()) / 1000);
    this.undoCountdown = Math.max(0, remaining);
  }

  undoDelete(): void {
    if (!this.deletedSessionId) return;

    const sessionId = this.deletedSessionId;
    this.deletedSessionId = '';
    this.undoDeadline = null;
    this.successMessage = '';
    if (this.undoTimer) {
      clearInterval(this.undoTimer);
      this.undoTimer = null;
    }

    this.api
      .restoreTraining(sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadHistory();
          this.successMessage = 'Exclusão desfeita com sucesso!';
          setTimeout(() => (this.successMessage = ''), 4000);
        },
        error: () => {
          this.errorMessage = 'Erro ao desfazer exclusão. O prazo pode ter expirado.';
          setTimeout(() => (this.errorMessage = ''), 5000);
        },
      });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  }

  getAttendanceLabel(present: number, total: number): string {
    return `${present}/${total} presentes`;
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }

  private setDetailState(partial: {
    selectedTraining?: TrainingDetailsResponse | null;
    detailError?: string;
    isLoadingDetail?: boolean;
  }): void {
    this.ngZone.run(() => {
      if (partial.selectedTraining !== undefined) {
        this.selectedTraining = partial.selectedTraining;
      }
      if (partial.detailError !== undefined) {
        this.detailError = partial.detailError;
      }
      if (partial.isLoadingDetail !== undefined) {
        this.isLoadingDetail = partial.isLoadingDetail;
      }
      this.cdr.detectChanges();
    });
  }
}
