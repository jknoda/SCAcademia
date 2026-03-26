import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import {
  ConfirmTrainingResponse,
  TrainingReviewSummaryResponse,
} from '../../types';

@Component({
  selector: 'app-training-review',
  standalone: false,
  templateUrl: './training-review.component.html',
  styleUrls: ['./training-review.component.scss'],
})
export class TrainingReviewComponent implements OnInit, OnDestroy {
  sessionId = '';
  summary: TrainingReviewSummaryResponse | null = null;

  isLoading = false;
  isConfirming = false;
  errorMessage = '';
  infoMessage = '';
  successMessage = '';
  showRetry = false;
  offlinePending = false;

  private retryCount = 0;
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 1200;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private isPendingRetry = false;
  private routeSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    if (!this.sessionId) {
      this.errorMessage = 'Sessão inválida para revisão.';
      return;
    }

    window.addEventListener('online', this.handleBackOnline);

    // F4: recarrega summary ao reentrar na tela via navegação
    this.routeSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        if ((e.urlAfterRedirects as string).includes(this.sessionId)) {
          this.loadSummary(true);
        }
      });

    // F5: sequencia syncPending após loadSummary completar
    this.loadSummary(false, () => {
      this.trySyncPendingConfirmation();
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.handleBackOnline);
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.routeSub?.unsubscribe();
  }

  get canConfirm(): boolean {
    if (!this.summary) {
      return false;
    }

    return this.summary.attendance.total > 0 && this.summary.techniques.count > 0;
  }

  onBackToNotes(): void {
    this.router.navigate(['/training/session', this.sessionId, 'notes']);
  }

  onBackToAttendance(): void {
    this.router.navigate(['/training/session', this.sessionId, 'attendance']);
  }

  onConfirm(): void {
    if (this.isConfirming || this.isPendingRetry) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.infoMessage = '';
    this.showRetry = false;
    this.retryCount = 0;

    if (!this.canConfirm) {
      this.errorMessage = 'Validação falhou: vincule alunos e técnicas antes de confirmar.';
      return;
    }

    if (!navigator.onLine) {
      this.markOfflinePending();
      return;
    }

    this.tryConfirmWithRetry();
  }

  onRetryConfirm(): void {
    if (!navigator.onLine) {
      this.markOfflinePending();
      return;
    }

    this.retryCount = 0;
    this.errorMessage = '';
    this.showRetry = false;
    this.tryConfirmWithRetry();
  }

  onConnectNow(): void {
    if (!navigator.onLine) {
      this.infoMessage = 'Ainda sem conexão com a internet.';
      return;
    }

    this.trySyncPendingConfirmation();
  }

  onContinueOffline(): void {
    this.infoMessage = 'Confirmação pendente. Você pode continuar offline.';
  }

  // F4/F5: skipFeedbackReset evita apagar feedback de sucesso no reload por NavigationEnd
  private loadSummary(skipFeedbackReset = false, onComplete?: () => void): void {
    this.setLoadingState(true);
    if (!skipFeedbackReset) {
      this.errorMessage = '';
      this.infoMessage = '';
    }

    this.api
      .getTrainingReviewSummary(this.sessionId)
      .pipe(finalize(() => {
        this.setLoadingState(false);
      }))
      .subscribe({
        next: (response) => {
          this.summary = response;
          onComplete?.();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || 'Não foi possível carregar o resumo da revisão.';
          onComplete?.();
        },
      });
  }

  private tryConfirmWithRetry(): void {
    this.isConfirming = true;

    this.api
      .confirmTrainingSession(this.sessionId)
      .pipe(finalize(() => {
        this.isConfirming = false;
      }))
      .subscribe({
        next: (response: ConfirmTrainingResponse) => {
          this.clearOfflinePending();
          this.router.navigate(
            ['/training/session', this.sessionId, 'success'],
            {
              queryParams: {
                confirmedAt: response.confirmedAt,
                studentsNotified: String(response.studentsNotified),
              },
            }
          );
        },
        error: (error) => {
          if (this.isOfflineError(error)) {
            this.markOfflinePending();
            return;
          }

          if (this.retryCount < this.maxRetries) {
            this.retryCount += 1;
            this.infoMessage = `Erro ao salvar. Nova tentativa automática ${this.retryCount}/${this.maxRetries}...`;
            // F3: bloqueia onConfirm durante janela de retry automático
            this.isPendingRetry = true;
            this.retryTimer = setTimeout(() => {
              this.isPendingRetry = false;
              this.tryConfirmWithRetry();
            }, this.retryDelayMs);
            return;
          }

          this.errorMessage =
            error?.error?.error ||
            'Erro ao salvar. Dados estão seguros localmente. Tente novamente.';
          this.showRetry = true;
        },
      });
  }

  private formatConfirmedAt(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  private isOfflineError(error: any): boolean {
    return !navigator.onLine || error?.status === 0;
  }

  private getPendingConfirmKey(): string {
    return `training_confirm_pending_${this.sessionId}`;
  }

  private markOfflinePending(): void {
    localStorage.setItem(this.getPendingConfirmKey(), '1');
    this.offlinePending = true;
    this.infoMessage =
      '⏱ Seu registro foi salvo localmente. Será sincronizado quando conectar.';
    this.errorMessage = '';
    this.showRetry = false;
  }

  private clearOfflinePending(): void {
    localStorage.removeItem(this.getPendingConfirmKey());
    this.offlinePending = false;
  }

  private trySyncPendingConfirmation(): void {
    this.offlinePending = localStorage.getItem(this.getPendingConfirmKey()) === '1';

    if (!this.offlinePending || !navigator.onLine) {
      return;
    }

    this.infoMessage = 'Conexão detectada. Sincronizando confirmação pendente...';
    this.retryCount = 0;
    this.tryConfirmWithRetry();
  }

  private handleBackOnline = (): void => {
    this.trySyncPendingConfirmation();
  };

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }
}
