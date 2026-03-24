import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ComplianceReportHistoryItem, ComplianceReportSchedule } from '../../types';

@Component({
  selector: 'app-compliance-reports-settings',
  standalone: false,
  templateUrl: './compliance-reports-settings.component.html',
  styleUrls: ['./compliance-reports-settings.component.scss'],
})
export class ComplianceReportsSettingsComponent implements OnInit {
  schedule: ComplianceReportSchedule | null = null;
  history: ComplianceReportHistoryItem[] = [];
  dayOfMonth = 1;
  hour = 8;
  minute = 0;
  enabled = true;
  loading = false;
  message = '';
  error = '';

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadSchedule();
    this.loadHistory();
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
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

  downloadReport(reportId: string): void {
    this.api.downloadComplianceReport(reportId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `LGPD_Conformidade_${reportId}.pdf`;
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
}
