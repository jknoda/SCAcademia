import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import {
  ComplianceReportAlert,
  ComplianceReportHistoryItem,
  DeletionRequestItem,
  MinorWithoutGuardianItem,
  User,
} from '../../types';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  currentUser: User | null = null;
  deletionStudentId = '';
  deletionReason = '';
  deletionConfirm = false;
  deletionMessage = '';
  deletionError = '';
  deletionLoading = false;
  pendingDeletionRequests: DeletionRequestItem[] = [];
  processingDue = false;
  complianceLoading = false;
  complianceMessage = '';
  complianceError = '';
  complianceAlerts: ComplianceReportAlert[] = [];
  complianceHistory: ComplianceReportHistoryItem[] = [];
  latestComplianceReport: ComplianceReportHistoryItem | null = null;
  minorsWithoutGuardianLoading = false;
  minorsWithoutGuardianError = '';
  minorsWithoutGuardian: MinorWithoutGuardianItem[] = [];

  constructor(private auth: AuthService, private router: Router, private api: ApiService) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      if (user.role === 'Admin') {
        this.loadPendingDeletionRequests();
        this.loadComplianceStatus();
        this.loadComplianceHistory();
        this.loadMinorsWithoutGuardian();
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getAcademyLogo(): string {
    return this.currentUser?.academy?.logoUrl || 'assets/default-academy-logo.svg';
  }

  getUserPhoto(): string {
    return this.currentUser?.photoUrl || 'assets/default-user-photo.svg';
  }

  goToConsentTemplates(): void {
    this.router.navigate(['/admin/consent-templates']);
  }

  goToAuditLogs(): void {
    this.router.navigate(['/admin/audit-logs']);
  }

  goToComplianceReports(): void {
    this.router.navigate(['/admin/compliance-reports']);
  }

  goToAcademyProfile(): void {
    this.router.navigate(['/admin/perfil-academia']);
  }

  goToProfessors(): void {
    this.router.navigate(['/admin/professores']);
  }

  goToStudents(): void {
    this.router.navigate(['/admin/alunos']);
  }

  goToMinorsWithoutGuardian(): void {
    this.router.navigate(['/admin/alunos'], {
      queryParams: { filter: 'minors-without-guardian' },
    });
  }

  goToMyProfile(): void {
    this.router.navigate(['/admin/meu-perfil']);
  }

  requestDeletion(): void {
    if (!this.deletionConfirm) {
      this.deletionError = 'Confirme que entende o impacto antes de solicitar a deleção.';
      return;
    }

    const studentId = this.deletionStudentId.trim();
    if (!studentId) {
      this.deletionError = 'Informe o ID do aluno.';
      return;
    }

    this.deletionLoading = true;
    this.deletionError = '';
    this.deletionMessage = '';

    this.api.requestStudentDeletion(studentId, this.deletionReason).subscribe({
      next: (res) => {
        this.deletionLoading = false;
        this.deletionMessage = res.message;
        this.deletionStudentId = '';
        this.deletionReason = '';
        this.deletionConfirm = false;
        this.loadPendingDeletionRequests();
      },
      error: (error) => {
        this.deletionLoading = false;
        this.deletionError = error?.error?.error || 'Erro ao solicitar deleção.';
      },
    });
  }

  loadPendingDeletionRequests(): void {
    this.api.listPendingDeletionRequests().subscribe({
      next: (res) => {
        this.pendingDeletionRequests = res.requests || [];
      },
      error: () => {
        this.pendingDeletionRequests = [];
      },
    });
  }

  cancelDeletionRequest(requestId: string): void {
    this.api.cancelDeletionRequest(requestId).subscribe({
      next: (res) => {
        this.deletionMessage = res.message;
        this.deletionError = '';
        this.loadPendingDeletionRequests();
      },
      error: (error) => {
        this.deletionError = error?.error?.error || 'Erro ao cancelar solicitação.';
      },
    });
  }

  processDueRequests(): void {
    this.processingDue = true;
    this.api.processDueDeletionRequests().subscribe({
      next: (res) => {
        this.processingDue = false;
        this.deletionMessage = `${res.message}. Processadas: ${res.processedCount}`;
        this.deletionError = '';
        this.loadPendingDeletionRequests();
      },
      error: (error) => {
        this.processingDue = false;
        this.deletionError = error?.error?.error || 'Erro ao processar solicitações vencidas.';
      },
    });
  }

  generateComplianceReport(): void {
    this.complianceLoading = true;
    this.complianceError = '';
    this.complianceMessage = 'Gerando relatório... (pode levar 2-3 min)';

    this.api.generateComplianceReport().subscribe({
      next: (res) => {
        this.complianceLoading = false;
        this.complianceMessage = res.message;
        this.complianceAlerts = res.alerts || [];
        this.loadComplianceStatus();
        this.loadComplianceHistory();
      },
      error: (error) => {
        this.complianceLoading = false;
        this.complianceError = this.getApiError(error, 'Erro ao gerar relatório de conformidade.');
      },
    });
  }

  loadComplianceStatus(): void {
    this.api.getComplianceReportStatus().subscribe({
      next: (res) => {
        this.latestComplianceReport = res.latestReport || null;
      },
      error: () => {
        this.latestComplianceReport = null;
      },
    });
  }

  loadComplianceHistory(): void {
    this.api.listComplianceReports().subscribe({
      next: (res) => {
        this.complianceHistory = res.reports || [];
      },
      error: () => {
        this.complianceHistory = [];
      },
    });
  }

  loadMinorsWithoutGuardian(): void {
    this.minorsWithoutGuardianLoading = true;
    this.minorsWithoutGuardianError = '';

    this.api.listMinorsWithoutGuardian().subscribe({
      next: (res) => {
        this.minorsWithoutGuardianLoading = false;
        this.minorsWithoutGuardian = res.students || [];
      },
      error: (error) => {
        this.minorsWithoutGuardianLoading = false;
        this.minorsWithoutGuardianError = this.getApiError(error, 'Erro ao carregar menores sem responsável.');
        this.minorsWithoutGuardian = [];
      },
    });
  }

  downloadComplianceReport(reportId: string): void {
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
        this.complianceError = this.getApiError(error, 'Erro ao baixar relatório de conformidade.');
      },
    });
  }

  getApiError(error: any, fallback: string): string {
    return error?.error?.error || error?.error?.message || fallback;
  }

  formatDateTime(value: string): string {
    return new Date(value).toLocaleString('pt-BR');
  }
}
