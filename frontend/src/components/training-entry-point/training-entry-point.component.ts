import { Component, OnDestroy, OnInit } from '@angular/core';
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
  errorMessage = '';
  infoMessage = '';
  isOnline = true;

  constructor(private api: ApiService, private router: Router) {}

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
    this.isOnline = navigator.onLine;
  };

  loadContext(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.getTrainingEntryPoint().subscribe({
      next: (response) => {
        this.context = response;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Não foi possível carregar o início do treino.';
        this.isLoading = false;
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

    this.api.startTrainingSession(turma.turmaId).subscribe({
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
}
