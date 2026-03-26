import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-training-success',
  standalone: false,
  templateUrl: './training-success.component.html',
  styleUrls: ['./training-success.component.scss'],
})
export class TrainingSuccessComponent implements OnInit, OnDestroy {
  sessionId = '';
  confirmedAt = '';
  studentsNotified = false;

  ctasVisible = false;
  redirectCountdown = 0;
  redirectCancelled = false;

  private ctaTimer: ReturnType<typeof setTimeout> | null = null;
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    const rawConfirmedAt = this.route.snapshot.queryParamMap.get('confirmedAt') || '';
    const rawStudentsNotified = this.route.snapshot.queryParamMap.get('studentsNotified');
    this.studentsNotified = rawStudentsNotified === 'true';
    
    let validatedTime = new Date().toISOString();
    if (rawConfirmedAt && !isNaN(new Date(rawConfirmedAt).getTime())) {
      validatedTime = rawConfirmedAt;
    }
    this.confirmedAt = this.formatTime(validatedTime);

    // AC2: highlight CTAs after 3 seconds
    this.ctaTimer = setTimeout(() => {
      this.ctasVisible = true;
    }, 3000);

    // AC6: start inactivity timer — 60s then countdown
    this.inactivityTimer = setTimeout(() => {
      this.startRedirectCountdown();
    }, 60000);
  }

  ngOnDestroy(): void {
    this.clearAllTimers();
  }

  onVoltarPainel(): void {
    this.clearAllTimers();
    this.router.navigate(['/home']);
  }

  onProximaAula(): void {
    this.clearAllTimers();
    this.router.navigate(['/training/entry-point']);
  }

  cancelRedirect(): void {
    this.redirectCancelled = true;
    this.redirectCountdown = 0;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  get formattedTimestamp(): string {
    return `Aula salva às ${this.confirmedAt} de hoje`;
  }

  get notificationText(): string {
    return this.studentsNotified ? 'Alunos foram notificados ✓' : 'Registro confirmado.';
  }

  private startRedirectCountdown(): void {
    if (this.redirectCancelled) {
      return;
    }
    this.redirectCountdown = 5;
    this.countdownInterval = setInterval(() => {
      if (this.redirectCountdown <= 1) {
        clearInterval(this.countdownInterval!);
        this.countdownInterval = null;
        this.router.navigate(['/home']);
        return;
      }
      this.redirectCountdown -= 1;
    }, 1000);
  }

  private formatTime(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  private clearAllTimers(): void {
    if (this.ctaTimer) {
      clearTimeout(this.ctaTimer);
      this.ctaTimer = null;
    }
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}
