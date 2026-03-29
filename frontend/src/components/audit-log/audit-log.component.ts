import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuditLogEntry, AuditLogsResponse } from '../../types';

@Component({
  selector: 'app-audit-log',
  standalone: false,
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss'],
})
export class AuditLogComponent implements OnInit {
  filterForm: FormGroup;
  logs: AuditLogEntry[] = [];
  total = 0;
  page = 1;
  totalPages = 1;
  limit = 50;
  loading = false;
  exporting = false;
  exportFormat: 'csv' | 'pdf' = 'csv';
  expandedLogId: string | null = null;
  errorMessage = '';

  readonly actionOptions = [
    { value: '', label: 'Todas as ações' },
    { value: 'CONSENT_SIGNED', label: 'Consentimento Assinado' },
    { value: 'CONSENT_SENT', label: 'Consentimento Enviado' },
    { value: 'CONSENT_RESENT', label: 'Consentimento Reenviado' },
    { value: 'TEMPLATES_PUBLISHED', label: 'Templates Publicados' },
    { value: 'USER_REGISTERED', label: 'Usuário Registrado' },
    { value: 'USER_LOGIN', label: 'Login de Usuário' },
    { value: 'ADMIN_LOGIN', label: 'Login de Admin' },
    { value: 'PASSWORD_RESET_REQUESTED', label: 'Reset de Senha Solicitado' },
    { value: 'PASSWORD_RESET_COMPLETED', label: 'Reset de Senha Concluído' },
    { value: 'AUDIT_LOG_VIEWED', label: 'Log de Auditoria Visualizado' },
    { value: 'AUDIT_LOG_EXPORTED', label: 'Log de Auditoria Exportado' },
    { value: 'TRAINING_CREATED', label: 'Treino Criado' },
    { value: 'TRAINING_UPDATED', label: 'Treino Atualizado' },
    { value: 'TRAINING_ATTENDANCE_MARKED', label: 'Presença Registrada' },
    { value: 'DATA_DELETION_REQUESTED', label: 'Solicitação de Deleção' },
    { value: 'DATA_DELETED', label: 'Dados Deletados' },
    { value: 'HEALTH_RECORD_VIEWED', label: 'Anamnese Visualizada' },
    { value: 'HEALTH_RECORD_UPDATED', label: 'Anamnese Atualizada' },
    { value: 'ADMIN_DASHBOARD_VIEWED', label: 'Dashboard Admin Visualizado' },
    { value: 'COMPLIANCE_REPORT_GENERATED', label: 'Relatório de Compliance Gerado' },
  ];

  readonly resourceOptions = [
    { value: '', label: 'Todos os recursos' },
    { value: 'consent', label: 'Consentimento' },
    { value: 'consent_template', label: 'Template de Consentimento' },
    { value: 'user', label: 'Usuário' },
    { value: 'academy', label: 'Academia' },
    { value: 'audit_log', label: 'Log de Auditoria' },
    { value: 'training', label: 'Treino' },
    { value: 'student_health', label: 'Anamnese' },
    { value: 'training_attendance', label: 'Frequência de Treino' },
    { value: 'performance_notes', label: 'Notas de Performance' },
  ];

  readonly outcomeOptions = [
    { value: '', label: 'Todos os resultados' },
    { value: 'SUCCESS', label: 'Success' },
    { value: 'DENIED', label: 'Denied' },
  ];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      userId: [''],
      action: [''],
      resourceType: [''],
      outcome: [''],
      dateFrom: [''],
      dateTo: [''],
    });
  }

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.errorMessage = '';
    const filter = this.filterForm.value;
    this.api.getAuditLogs(filter, this.page, this.limit).subscribe({
      next: (res: AuditLogsResponse) => {
        this.logs = res.logs;
        this.total = res.total;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erro ao carregar logs de auditoria.';
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadLogs();
  }

  clearFilters(): void {
    this.filterForm.reset({ userId: '', action: '', resourceType: '', outcome: '', dateFrom: '', dateTo: '' });
    this.page = 1;
    this.loadLogs();
  }

  goToPage(n: number): void {
    if (n < 1 || n > this.totalPages) return;
    this.page = n;
    this.loadLogs();
  }

  exportCsv(): void {
    this.exporting = true;
    const filter = this.filterForm.value;
    this.api.exportAuditLogsCsv(filter).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const today = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `auditoria-lgpd-${today}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting = false;
      },
      error: () => {
        this.errorMessage = 'Erro ao exportar CSV.';
        this.exporting = false;
      },
    });
  }

  exportPdf(): void {
    this.exporting = true;
    const filter = this.filterForm.value;
    this.api.exportAuditLogsPdf(filter).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const today = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `Auditoria_LGPD_${today}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting = false;
      },
      error: () => {
        this.errorMessage = 'Erro ao exportar PDF.';
        this.exporting = false;
      },
    });
  }

  exportSelected(): void {
    if (this.exportFormat === 'pdf') {
      this.exportPdf();
      return;
    }
    this.exportCsv();
  }

  toggleLogDetail(logId: string): void {
    this.expandedLogId = this.expandedLogId === logId ? null : logId;
  }

  getOutcomeLabel(outcome?: 'SUCCESS' | 'DENIED'): string {
    return outcome === 'DENIED' ? 'Denied' : 'Success';
  }

  getOutcomeClass(outcome?: 'SUCCESS' | 'DENIED'): string {
    return outcome === 'DENIED' ? 'outcome-denied' : 'outcome-success';
  }

  getDeniedReason(log: AuditLogEntry): string {
    if (!log.changesJson || typeof log.changesJson !== 'object') {
      return 'Sem detalhe adicional.';
    }

    const maybeReason = (log.changesJson.reason || log.changesJson.error || log.changesJson.message) as
      | string
      | undefined;
    return maybeReason || 'Sem motivo informado.';
  }

  investigateLog(log: AuditLogEntry): void {
    this.toggleLogDetail(log.logId);
  }

  blockUser(log: AuditLogEntry): void {
    this.router.navigate(['/admin/users'], {
      queryParams: {
        q: log.actorName || log.actorId || '',
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  getActionLabel(action: string): string {
    const found = this.actionOptions.find((o) => o.value === action);
    return found ? found.label : action;
  }

  getActionColor(action: string): string {
    if (action.includes('FAILED') || action.includes('DENIED') || action.includes('DELETE') || action.includes('REMOVED')) {
      return 'action-warning';
    }
    if (action.includes('SIGNED') || action.includes('COMPLETED') || action.includes('REGISTERED')) {
      return 'action-success';
    }
    if (action.includes('EXPORTED') || action.includes('VIEWED')) {
      return 'action-info';
    }
    if (action.includes('PUBLISHED') || action.includes('SENT')) {
      return 'action-warning';
    }
    if (action.includes('LOGIN')) {
      return 'action-neutral';
    }
    return 'action-default';
  }

  formatTimestamp(ts: string): string {
    return new Date(ts).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  get pages(): number[] {
    const range: number[] = [];
    const start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, this.page + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }
}
