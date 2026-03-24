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
  ];

  readonly resourceOptions = [
    { value: '', label: 'Todos os recursos' },
    { value: 'consent', label: 'Consentimento' },
    { value: 'consent_template', label: 'Template de Consentimento' },
    { value: 'user', label: 'Usuário' },
    { value: 'academy', label: 'Academia' },
    { value: 'audit_log', label: 'Log de Auditoria' },
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
    this.filterForm.reset({ userId: '', action: '', resourceType: '', dateFrom: '', dateTo: '' });
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
