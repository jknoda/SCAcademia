import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil, timeout } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import {
  BackupIntegrityResponse,
  BackupJob,
  BackupScheduleConfig,
  BackupScheduleUpdatePayload,
  RestoreBackupPayload,
  TriggerBackupPayload,
} from '../../types';

@Component({
  selector: 'app-admin-backup-recovery',
  standalone: false,
  templateUrl: './admin-backup-recovery.component.html',
  styleUrls: ['./admin-backup-recovery.component.scss'],
})
export class AdminBackupRecoveryComponent implements OnInit, OnDestroy {
  jobs: BackupJob[] = [];
  schedule: BackupScheduleConfig | null = null;
  lastAutoBackup: BackupJob | null = null;

  isLoading = false;
  isTriggeringBackup = false;
  isSavingSchedule = false;
  activeJobId: string | null = null;
  errorMessage = '';
  successMessage = '';

  showTriggerForm = false;
  showRestoreModal = false;
  showVerifyModal = false;

  triggerPayload: TriggerBackupPayload = {
    includeHistory: true,
    isEncrypted: false,
    encryptionPassword: '',
  };

  schedulePayload: BackupScheduleUpdatePayload = {
    hour: 2,
    minute: 30,
    enabled: true,
    retentionDays: 30,
  };

  restoreTargetJob: BackupJob | null = null;
  restorePayload: RestoreBackupPayload = {
    adminPassword: '',
    encryptionPassword: '',
  };

  verifyTargetJob: BackupJob | null = null;
  verifyResult: BackupIntegrityResponse | null = null;

  private destroy$ = new Subject<void>();
  private pollInterval: number | null = null;

  constructor(
    private api: ApiService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.clearPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  loadData(): void {
    this.setLoadingState(true);
    this.errorMessage = '';

    this.api
      .listAdminBackups()
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$),
        finalize(() => this.setLoadingState(false))
      )
      .subscribe({
        next: (res) => {
          this.jobs = res.jobs || [];
          this.schedule = res.schedule || null;
          this.lastAutoBackup = res.lastAutoBackup || null;
          if (res.schedule) {
            this.schedulePayload = {
              hour: res.schedule.hour,
              minute: res.schedule.minute,
              enabled: res.schedule.enabled,
              retentionDays: res.schedule.retentionDays,
            };
          }
          this.refreshView();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || 'Erro ao carregar backup e recovery.';
          this.refreshView();
        },
      });
  }

  openTriggerForm(): void {
    this.showTriggerForm = true;
    this.triggerPayload = {
      includeHistory: true,
      isEncrypted: false,
      encryptionPassword: '',
    };
  }

  triggerBackup(): void {
    if (this.triggerPayload.isEncrypted && !this.triggerPayload.encryptionPassword) {
      this.errorMessage = 'Informe a senha de criptografia para gerar backup protegido.';
      return;
    }

    this.setTriggeringBackupState(true);
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .triggerAdminBackup(this.triggerPayload)
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$),
        finalize(() => this.setTriggeringBackupState(false))
      )
      .subscribe({
        next: (res) => {
          this.showTriggerForm = false;
          this.successMessage = res.message;
          this.activeJobId = res.jobId;
          this.startPolling(res.jobId);
          this.refreshView();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || 'Erro ao iniciar backup.';
          this.refreshView();
        },
      });
  }

  startPolling(jobId: string): void {
    this.clearPolling();
    this.loadData();
    this.pollInterval = window.setInterval(() => {
      this.api
        .getAdminBackupJobStatus(jobId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.jobs = this.jobs.map((job) => (job.id === res.job.id ? res.job : job));
            if (res.job.status !== 'pending' && res.job.status !== 'running') {
              this.clearPolling();
              this.activeJobId = null;
              this.successMessage =
                res.job.status === 'completed'
                  ? 'Backup concluído com sucesso.'
                  : res.job.errorMessage || 'Falha ao gerar backup.';
              this.loadData();
            }
            this.refreshView();
          },
          error: () => {
            this.clearPolling();
          },
        });
    }, 2000);
  }

  clearPolling(): void {
    if (this.pollInterval !== null) {
      window.clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  downloadBackup(jobId: string): void {
    this.api
      .downloadAdminBackup(jobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const blob = response.body;
          if (!blob) {
            this.errorMessage = 'Arquivo de backup indisponível.';
            return;
          }

          const contentDisposition = response.headers.get('content-disposition') || '';
          const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
          const fileName = fileNameMatch?.[1] || 'backup.sql.gz';
          const url = window.URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = fileName;
          anchor.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || 'Erro ao baixar backup.';
        },
      });
  }

  openVerifyModal(job: BackupJob): void {
    this.verifyTargetJob = job;
    this.verifyResult = null;
    this.showVerifyModal = true;

    this.api
      .verifyAdminBackup(job.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.verifyResult = result;
        },
        error: (error) => {
          this.verifyResult = {
            valid: false,
            sizeBytes: 0,
            reason: error?.error?.error || 'Erro ao verificar integridade.',
          };
        },
      });
  }

  openRestoreModal(job: BackupJob): void {
    this.restoreTargetJob = job;
    this.restorePayload = {
      adminPassword: '',
      encryptionPassword: '',
    };
    this.showRestoreModal = true;
  }

  canConfirmRestore(): boolean {
    if (!this.restorePayload.adminPassword.trim()) {
      return false;
    }

    if (this.restoreTargetJob?.isEncrypted && !this.restorePayload.encryptionPassword?.trim()) {
      return false;
    }

    return true;
  }

  confirmRestore(): void {
    if (!this.restoreTargetJob || !this.canConfirmRestore()) {
      return;
    }

    this.api
      .restoreAdminBackup(this.restoreTargetJob.id, this.restorePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.successMessage = res.message;
          this.showRestoreModal = false;
          this.restoreTargetJob = null;
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || 'Erro ao iniciar restore.';
        },
      });
  }

  deleteBackup(job: BackupJob): void {
    if (!window.confirm(`Remover o backup ${job.fileName || job.id}?`)) {
      return;
    }

    this.api
      .deleteAdminBackupJob(job.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.successMessage = res.message;
          this.loadData();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || 'Erro ao remover backup.';
        },
      });
  }

  saveSchedule(): void {
    this.setSavingScheduleState(true);
    this.api
      .upsertAdminBackupSchedule(this.schedulePayload)
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$),
        finalize(() => this.setSavingScheduleState(false))
      )
      .subscribe({
        next: (schedule) => {
          this.schedule = schedule;
          this.successMessage = 'Agendamento de backup salvo com sucesso.';
          this.refreshView();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || 'Erro ao salvar agendamento de backup.';
          this.refreshView();
        },
      });
  }

  closeModals(): void {
    this.showTriggerForm = false;
    this.showRestoreModal = false;
    this.showVerifyModal = false;
    this.restoreTargetJob = null;
    this.verifyTargetJob = null;
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }

  private setTriggeringBackupState(value: boolean): void {
    this.ngZone.run(() => {
      this.isTriggeringBackup = value;
      this.cdr.detectChanges();
    });
  }

  private setSavingScheduleState(value: boolean): void {
    this.ngZone.run(() => {
      this.isSavingSchedule = value;
      this.cdr.detectChanges();
    });
  }

  private refreshView(): void {
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
  }

  formatDateTime(value: string | null): string {
    return value ? new Date(value).toLocaleString('pt-BR') : 'N/D';
  }

  formatFileSize(sizeBytes: number): string {
    if (!sizeBytes) {
      return 'N/D';
    }

    if (sizeBytes >= 1024 * 1024) {
      return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    if (sizeBytes >= 1024) {
      return `${(sizeBytes / 1024).toFixed(1)} KB`;
    }

    return `${sizeBytes} B`;
  }

  getJobTypeLabel(type: BackupJob['type']): string {
    return type === 'auto' ? 'Automático' : 'Manual';
  }

  getStatusLabel(status: BackupJob['status']): string {
    switch (status) {
      case 'completed':
        return 'OK';
      case 'running':
        return 'RUNNING';
      case 'failed':
        return 'FAILED';
      case 'deleted':
        return 'EXPIRED';
      default:
        return 'PENDING';
    }
  }
}