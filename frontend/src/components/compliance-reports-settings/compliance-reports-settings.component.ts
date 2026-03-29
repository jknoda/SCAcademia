import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import {
  ComplianceReportFormat,
  ComplianceReportGenerationProgress,
  ComplianceReportHistoryItem,
  ComplianceReportPeriodPreset,
  ComplianceReportSchedule,
  GenerateComplianceReportResponse,
} from '../../types';

@Component({
  selector: 'app-compliance-reports-settings',
  standalone: false,
  templateUrl: './compliance-reports-settings.component.html',
  styleUrls: ['./compliance-reports-settings.component.scss'],
})
export class ComplianceReportsSettingsComponent implements OnInit, OnDestroy {
  schedule: ComplianceReportSchedule | null = null;
  history: ComplianceReportHistoryItem[] = [];
  lastGeneratedReport: GenerateComplianceReportResponse | null = null;
  latestStatusMessage = '';

  dayOfMonth = 1;
  hour = 8;
  minute = 0;
  enabled = true;
  loading = false;
  showGenerateModal = false;

  generationFormat: ComplianceReportFormat = 'pdf';
  generationPeriodPreset: ComplianceReportPeriodPreset = 'current-month';
  generationDateFrom = '';
  generationDateTo = '';
  generationSignDigital = true;

  generationState: ComplianceReportGenerationProgress = {
    status: 'idle',
    percentage: 0,
    message: '',
  };

  message = '';
  error = '';
  private progressSubscription: Subscription | null = null;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadSchedule();
    this.loadStatus();
    this.loadHistory();
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  openGenerateModal(): void {
    this.error = '';
    this.message = '';
    this.showGenerateModal = true;
  }

  closeGenerateModal(): void {
    if (this.generationState.status === 'processing') {
      return;
    }
    this.showGenerateModal = false;
  }

  loadSchedule(): void {
    this.api.getComplianceReportSchedule().subscribe({
      next: (res) => {
        this.schedule = res.schedule;
        if (res.schedule) {
          this.dayOfMonth = res.schedule.dayOfMonth;
          this.hour = res.schedule.hour;
          this.minute = res.schedule.minute;
          this.enabled = res.schedule.enabled;
        }
      },
      error: () => {
        this.schedule = null;
      },
    });
  }

  loadHistory(): void {
    this.api.listComplianceReports().subscribe({
      next: (res) => {
        this.history = res.reports || [];
      },
      error: () => {
        this.history = [];
      },
    });
  }

  loadStatus(): void {
    this.api.getComplianceReportStatus().subscribe({
      next: (res) => {
        this.latestStatusMessage = res.message || '';
      },
      error: () => {
        this.latestStatusMessage = '';
      },
    });
  }

  saveSchedule(): void {
    this.loading = true;
    this.error = '';
    this.message = '';

    this.api
      .saveComplianceReportSchedule({
        dayOfMonth: this.dayOfMonth,
        hour: this.hour,
        minute: this.minute,
        enabled: this.enabled,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.message = res.message;
          this.schedule = res.schedule;
        },
        error: (error) => {
          this.loading = false;
          this.error = error?.error?.error || error?.error?.message || 'Erro ao salvar agendamento.';
        },
      });
  }

  generateReport(): void {
    this.error = '';
    this.message = '';

    if (this.generationPeriodPreset === 'custom') {
      if (!this.generationDateFrom || !this.generationDateTo) {
        this.error = 'Informe dateFrom e dateTo para o período customizado.';
        return;
      }

      if (this.generationDateFrom > this.generationDateTo) {
        this.error = 'dateFrom deve ser menor ou igual a dateTo.';
        return;
      }
    }

    this.generationState = {
      status: 'processing',
      percentage: 15,
      message: 'Processando relatório de conformidade...',
    };

    this.progressSubscription?.unsubscribe();
    this.progressSubscription = interval(250).subscribe(() => {
      if (this.generationState.status !== 'processing') {
        return;
      }

      if (this.generationState.percentage < 90) {
        this.generationState = {
          ...this.generationState,
          percentage: this.generationState.percentage + 5,
        };
      }
    });

    this.api
      .generateComplianceReport({
        format: this.generationFormat,
        periodPreset: this.generationPeriodPreset,
        dateFrom: this.generationPeriodPreset === 'custom' ? this.generationDateFrom : undefined,
        dateTo: this.generationPeriodPreset === 'custom' ? this.generationDateTo : undefined,
        signDigital: this.generationSignDigital,
      })
      .subscribe({
        next: (res) => {
          this.progressSubscription?.unsubscribe();
          this.generationState = {
            status: 'completed',
            percentage: 100,
            message: 'Relatório gerado com sucesso.',
          };
          this.lastGeneratedReport = res;
          this.message = `${res.fileName} pronto para download.`;
          this.latestStatusMessage = 'Relatório de conformidade disponível para download';
          this.loadHistory();
        },
        error: (error) => {
          this.progressSubscription?.unsubscribe();
          this.generationState = {
            status: 'error',
            percentage: 0,
            message: 'Falha na geração do relatório.',
          };
          this.error = error?.error?.error || error?.error?.message || 'Erro ao gerar relatório.';
        },
      });
  }

  downloadReport(reportId: string, fileName?: string): void {
    this.api.downloadComplianceReport(reportId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName || `LGPD_Conformidade_${reportId}.pdf`;
        anchor.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.error = error?.error?.error || error?.error?.message || 'Erro ao baixar relatório.';
      },
    });
  }

  formatDateTime(value: string): string {
    return new Date(value).toLocaleString('pt-BR');
  }

  getComplianceStatusLabel(status?: string): string {
    return status || 'COMPLIANT';
  }

  getFormatLabel(format: ComplianceReportFormat): string {
    if (format === 'excel') {
      return 'Excel';
    }
    if (format === 'json') {
      return 'JSON';
    }
    return 'PDF';
  }

  ngOnDestroy(): void {
    this.progressSubscription?.unsubscribe();
  }
}
