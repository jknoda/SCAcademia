import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import {
  AthleteAssessmentRecord,
  AthletePeriodComparison,
  AthletePeriodComparisonChange,
  AthleteProgressAlert,
  AthleteProgressHistoryResponse,
  StudentProgressWeekly,
  User,
} from '../../types';

@Component({
  selector: 'app-athlete-progress-dashboard',
  standalone: false,
  templateUrl: './athlete-progress-dashboard.component.html',
  styleUrls: ['./athlete-progress-dashboard.component.scss'],
})
export class AthleteProgressDashboardComponent implements OnInit {
  currentUser: User | null = null;
  studentId = '';
  returnTo = '';
  isLoading = false;
  errorMessage = '';
  dashboard: AthleteProgressHistoryResponse | null = null;
  filteredAssessments: AthleteAssessmentRecord[] = [];
  chartData: StudentProgressWeekly[] = [];
  selectedPeriod: '30d' | '90d' | 'all' = '90d';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.studentId = this.route.snapshot.paramMap.get('studentId') || '';
    this.returnTo = this.route.snapshot.queryParamMap.get('returnTo') || '';

    if (!this.studentId) {
      this.errorMessage = 'Atleta não encontrado para exibir o painel.';
      return;
    }

    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.dashboard = null;
    this.filteredAssessments = [];
    this.chartData = [];

    try {
      this.api.getAthleteProgress(this.studentId).pipe(
        timeout(10000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      ).subscribe({
        next: (response) => {
          this.dashboard = response;
          this.applyPeriodFilter();
        },
        error: (error) => {
          this.errorMessage = this.getLoadErrorMessage(error);
        },
      });
    } catch (error) {
      this.errorMessage = this.getLoadErrorMessage(error);
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  applyPeriodFilter(period?: '30d' | '90d' | 'all'): void {
    if (period) {
      this.selectedPeriod = period;
    }

    const assessments = [...(this.dashboard?.assessments || [])].sort(
      (a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
    );

    if (this.selectedPeriod === 'all') {
      this.filteredAssessments = assessments;
    } else {
      const days = this.selectedPeriod === '30d' ? 30 : 90;
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - days);
      this.filteredAssessments = assessments.filter(
        (assessment) => new Date(assessment.assessmentDate).getTime() >= threshold.getTime()
      );
    }

    this.chartData = [...this.filteredAssessments]
      .sort((a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime())
      .map((assessment, index) => ({
        weekNumber: index + 1,
        date: assessment.assessmentDate,
        proficiencyPercent: this.toPercentScore(assessment),
      }));
  }

  goBack(): void {
    if (this.returnTo) {
      this.router.navigateByUrl(this.returnTo);
      return;
    }

    this.router.navigate(['/home']);
  }

  goToEvaluation(): void {
    this.router.navigate(['/athlete-progress', this.studentId, 'evaluation'], {
      queryParams: { returnTo: this.router.url || `/athlete-progress/${this.studentId}/dashboard` },
    });
  }

  goToIndicatorConfiguration(): void {
    this.router.navigate(['/athlete-progress/configuration']);
  }

  canEditEvaluation(): boolean {
    return this.currentUser?.role === 'Professor' || this.currentUser?.role === 'Admin';
  }

  getLatestAssessment(): AthleteAssessmentRecord | null {
    return this.filteredAssessments[0] || this.dashboard?.assessments?.[0] || null;
  }

  getLatestMetric(metricCode: string): AthleteAssessmentRecord['metrics'][number] | null {
    return this.getLatestAssessment()?.metrics.find((item) => item.metricCode === metricCode) || null;
  }

  getMetricDisplayValue(metric: AthleteAssessmentRecord['metrics'][number] | null | undefined): string {
    if (!metric) {
      return '-';
    }

    if (metric.displayValue) {
      return metric.displayValue;
    }

    if (metric.secondaryValue !== undefined) {
      return `${metric.value}:${metric.secondaryValue}`;
    }

    if (metric.unit === 'score') {
      return `${metric.value}/5`;
    }

    if (metric.unit === 'percent') {
      return `${metric.value}%`;
    }

    if (metric.unit === 'count') {
      return String(metric.value);
    }

    return metric.unit ? `${metric.value} ${metric.unit}` : String(metric.value);
  }

  getSummaryValue(metricCode: string): string {
    return this.getMetricDisplayValue(this.getLatestMetric(metricCode));
  }

  getTrendLabel(): string {
    if (this.chartData.length < 2) {
      return 'Dados insuficientes';
    }

    const delta = this.chartData[this.chartData.length - 1].proficiencyPercent - this.chartData[0].proficiencyPercent;
    if (delta > 5) return 'Evolução positiva';
    if (delta < -5) return 'Oscilação recente';
    return 'Estável';
  }

  getActiveComparison(): AthletePeriodComparison | null {
    return this.dashboard?.comparisons?.[this.selectedPeriod] || null;
  }

  getVisibleAlerts(): AthleteProgressAlert[] {
    return this.dashboard?.alerts || [];
  }

  getAlertBadge(alert: AthleteProgressAlert): string {
    if (alert.kind === 'insight') {
      return 'Insight';
    }

    if (alert.severity === 'high') {
      return 'Alta prioridade';
    }

    if (alert.severity === 'medium') {
      return 'Acompanhar';
    }

    return 'Observação';
  }

  getAlertBadgeClass(alert: AthleteProgressAlert): string {
    if (alert.kind === 'insight') {
      return 'mini-badge mini-badge--success';
    }

    if (alert.severity === 'high') {
      return 'mini-badge mini-badge--danger';
    }

    if (alert.severity === 'medium') {
      return 'mini-badge mini-badge--warning';
    }

    return 'mini-badge mini-badge--neutral';
  }

  getComparisonBadge(change: AthletePeriodComparisonChange): string {
    switch (change.trend) {
      case 'up':
        return 'Melhora';
      case 'down':
        return 'Queda';
      case 'stable':
        return 'Estável';
      default:
        return 'Parcial';
    }
  }

  getComparisonDeltaText(change: AthletePeriodComparisonChange): string {
    if (change.delta === null) {
      return 'Sem base suficiente para cálculo';
    }

    const prefix = change.delta > 0 ? '+' : '';
    const percent = change.deltaPercent === null ? '' : ` (${prefix}${change.deltaPercent}%)`;
    return `${prefix}${change.delta}${percent}`;
  }

  formatComparisonValue(value: number | null): string {
    return value === null ? '-' : String(value);
  }

  getNotesPreview(notes?: string): string {
    if (!notes) {
      return 'Sem observações registradas.';
    }

    return notes.length > 180 ? `${notes.slice(0, 180)}...` : notes;
  }

  trackByAssessment(_: number, item: AthleteAssessmentRecord): string {
    return item.assessmentId;
  }

  private getLoadErrorMessage(error: any): string {
    const details = error?.error?.error || error?.message;
    return details
      ? `Erro ao carregar o painel individual de evolução. ${details}`
      : 'Erro ao carregar o painel individual de evolução.';
  }

  private toPercentScore(assessment: AthleteAssessmentRecord): number {
    const metric = assessment.metrics.find((item) => item.metricCode === 'overall_progress');
    const rawValue = metric ? Number(metric.value) : this.averageMetricScore(assessment);

    if (Number.isNaN(rawValue)) {
      return 0;
    }

    if ((metric?.unit || 'score') === 'percent') {
      return Math.max(0, Math.min(100, rawValue));
    }

    return Math.max(0, Math.min(100, rawValue * 20));
  }

  private averageMetricScore(assessment: AthleteAssessmentRecord): number {
    if (!assessment.metrics.length) {
      return 0;
    }

    const total = assessment.metrics.reduce((sum, item) => sum + Number(item.value || 0), 0);
    return total / assessment.metrics.length;
  }
}
