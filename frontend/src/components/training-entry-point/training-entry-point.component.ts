import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { TrainingEntryPointResponse } from '../../types';

@Component({
  selector: 'app-training-entry-point',
  standalone: false,
  templateUrl: './training-entry-point.component.html',
  styleUrls: ['./training-entry-point.component.scss'],
})
export class TrainingEntryPointComponent implements OnInit, OnDestroy {
  context: TrainingEntryPointResponse | null = null;
  isLoading = false;
  isStarting = false;
  isContinuingLastSession = false;
  errorMessage = '';
  infoMessage = '';
  isOnline = true;
  sessionDate = '';
  sessionTime = '';

  constructor(
    private api: ApiService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isOnline = navigator.onLine;
    window.addEventListener('online', this.handleOnlineStatus);
    window.addEventListener('offline', this.handleOnlineStatus);
    this.loadContext();
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.handleOnlineStatus);
    window.removeEventListener('offline', this.handleOnlineStatus);
  }

  private handleOnlineStatus = (): void => {
    this.ngZone.run(() => {
      this.isOnline = navigator.onLine;
      this.cdr.detectChanges();
    });
  };

  loadContext(): void {
    this.setLoadingState(true);
    this.errorMessage = '';

    this.api.getTrainingEntryPoint().subscribe({
      next: (response) => {
        this.context = response;
        this.setLoadingState(false);
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Não foi possível carregar o início do treino.';
        this.setLoadingState(false);
      },
    });
  }

  startNow(): void {
    const turma = this.context?.currentOrNextClass;
    if (!turma) {
      this.errorMessage = 'Nenhuma turma disponível para iniciar agora.';
      return;
    }

    this.isStarting = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.api.startTrainingSession(
      turma.turmaId,
      this.sessionDate || undefined,
      this.sessionTime || undefined
    ).subscribe({
      next: (response) => {
        this.isStarting = false;
        this.router.navigate(['/training/session', response.sessionId, 'attendance']);
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Não foi possível iniciar o treino.';
        this.isStarting = false;
      },
    });
  }

  maybeLater(): void {
    this.infoMessage = 'Sem problemas. Você pode iniciar o registro quando quiser.';
  }

  reloadForNextClass(): void {
    this.infoMessage = '';
    this.loadContext();
  }

  continueLastSession(): void {
    if (this.isContinuingLastSession) {
      return;
    }

    this.isContinuingLastSession = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.api.getTrainingHistory(undefined, 1, 0).subscribe({
      next: (response) => {
        this.isContinuingLastSession = false;
        const lastSessionId = response?.data?.trainings?.[0]?.session_id;
        if (!lastSessionId) {
          this.infoMessage = 'Ainda não há sessão anterior para continuar. Tente iniciar por uma turma ativa.';
          return;
        }

        this.router.navigate(['/training/session', lastSessionId, 'attendance']);
      },
      error: (error) => {
        this.isContinuingLastSession = false;
        this.errorMessage =
          error?.error?.error || 'Não foi possível localizar uma sessão anterior para continuar.';
      },
    });
  }

  goToHistory(): void {
    this.router.navigate(['/training/history']);
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }
}
