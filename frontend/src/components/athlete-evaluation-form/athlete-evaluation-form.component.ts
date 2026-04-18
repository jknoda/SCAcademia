import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';

import { ApiService } from '../../services/api.service';
import {
  AthleteAssessmentMetricInput,
  AthleteAssessmentPayload,
  AthleteIndicatorDefinition,
  AthleteIndicatorGroup,
  AthleteProgressHistoryResponse,
} from '../../types';

@Component({
  selector: 'app-athlete-evaluation-form',
  standalone: false,
  templateUrl: './athlete-evaluation-form.component.html',
  styleUrls: ['./athlete-evaluation-form.component.scss'],
})
export class AthleteEvaluationFormComponent implements OnInit {
  form!: FormGroup;
  studentId = '';
  returnTo = '';
  isLoading = false;
  isFetching = false;
  isEditMode = false;
  latestAssessmentId = '';
  athleteName = '';
  successMessage = '';
  errorMessage = '';
  latestSnapshot: AthleteProgressHistoryResponse | null = null;
  indicatorGroups: AthleteIndicatorGroup[] = [];

  readonly scoreOptions = [1, 2, 3, 4, 5];
  private readonly ratioRegex = /^\d+\s*:\s*\d+$/;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      assessmentDate: [this.getToday(), Validators.required],
      generalNotes: ['', [Validators.maxLength(1500)]],
    });

    this.applyIndicatorConfiguration();

    this.studentId = this.route.snapshot.paramMap.get('studentId') || '';
    this.returnTo = this.route.snapshot.queryParamMap.get('returnTo') || '';

    if (!this.studentId) {
      this.errorMessage = 'Aluno não encontrado para avaliação.';
      return;
    }

    this.loadLatestEvaluation();
  }

  getFieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Este campo é obrigatório';
    if (control.errors['maxlength']) return `Limite de ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['min'] || control.errors['max']) return 'Informe um valor válido para o indicador';
    if (control.errors['pattern']) return 'Use o formato esperado, por exemplo 10:2';
    return 'Campo inválido';
  }

  getMetricControlName(indicator: AthleteIndicatorDefinition): string {
    return `metric_${indicator.code}`;
  }

  isScoreMetric(indicator: AthleteIndicatorDefinition): boolean {
    return indicator.valueType === 'score';
  }

  isNumberMetric(indicator: AthleteIndicatorDefinition): boolean {
    return indicator.valueType === 'integer' || indicator.valueType === 'decimal';
  }

  getMetricInputType(indicator: AthleteIndicatorDefinition): string {
    return indicator.valueType === 'decimal' ? 'number' : 'text';
  }

  getMetricPlaceholder(indicator: AthleteIndicatorDefinition): string {
    if (indicator.displayFormat === 'ratio' || indicator.valueType === 'structured') {
      return 'Ex.: 10:2';
    }

    if (indicator.unit === 'percent') {
      return 'Ex.: 85';
    }

    return 'Informe o valor';
  }

  getIndicatorCount(): number {
    return this.getAllIndicators().length;
  }

  goBack(): void {
    if (this.returnTo) {
      this.router.navigateByUrl(this.returnTo);
      return;
    }

    this.router.navigate(['/admin/alunos']);
  }

  goToIndicatorConfiguration(): void {
    this.router.navigate(['/athlete-progress/configuration']);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.studentId) {
      this.errorMessage = 'Aluno não encontrado para avaliação.';
      return;
    }

    this.setLoadingState(true);
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.buildPayload();
    const request$ = this.isEditMode && this.latestAssessmentId
      ? this.api.updateAthleteAssessment(this.latestAssessmentId, payload)
      : this.api.createAthleteAssessment(this.studentId, payload);

    request$.pipe(
      timeout(10000),
      finalize(() => this.setLoadingState(false))
    ).subscribe({
      next: (response) => {
        this.isEditMode = true;
        this.latestAssessmentId = response.data.assessmentId;
        this.successMessage = 'Avaliação de evolução salva com sucesso.';
        this.loadLatestEvaluation();
        this.refreshView();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Erro ao salvar a avaliação de evolução.';
        this.refreshView();
      },
    });
  }

  private loadLatestEvaluation(): void {
    this.setFetchingState(true);
    this.errorMessage = '';

    this.api.getAthleteProgress(this.studentId).pipe(
      timeout(10000),
      finalize(() => this.setFetchingState(false))
    ).subscribe({
      next: (response) => {
        this.latestSnapshot = response;
        this.athleteName = response.athleteName || '';
        this.applyIndicatorConfiguration(response.indicatorGroups);

        const latest = response.assessments?.[0];
        if (!latest) {
          return;
        }

        this.isEditMode = true;
        this.latestAssessmentId = latest.assessmentId;

        const patch: Record<string, unknown> = {
          assessmentDate: (latest.assessmentDate || '').slice(0, 10) || this.getToday(),
          generalNotes: latest.notes || '',
        };

        for (const indicator of this.getAllIndicators()) {
          const metric = latest.metrics.find((item) => item.metricCode === indicator.code);
          if (!metric) {
            continue;
          }

          patch[this.getMetricControlName(indicator)] =
            metric.displayValue ??
            (metric.secondaryValue !== undefined ? `${metric.value}:${metric.secondaryValue}` : metric.value);
        }

        this.form.patchValue(patch);
        this.refreshView();
      },
      error: (error) => {
        if (error?.status !== 404) {
          this.errorMessage = error?.error?.error || 'Erro ao carregar histórico de evolução.';
        }
        this.refreshView();
      },
    });
  }

  private applyIndicatorConfiguration(groups?: AthleteIndicatorGroup[]): void {
    const sourceGroups = (groups && groups.length ? groups : this.getFallbackIndicatorGroups())
      .filter((group) => group.isActive !== false)
      .map((group) => ({
        ...group,
        indicators: [...(group.indicators || [])]
          .filter((indicator) => indicator.isActive !== false)
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
      }))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    this.indicatorGroups = sourceGroups;

    for (const indicator of this.getAllIndicators()) {
      const controlName = this.getMetricControlName(indicator);
      if (!this.form.contains(controlName)) {
        this.form.addControl(controlName, this.fb.control(this.getDefaultMetricValue(indicator), this.getValidatorsForIndicator(indicator)));
      }
    }
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }

  private setFetchingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isFetching = value;
      this.cdr.detectChanges();
    });
  }

  private refreshView(): void {
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
  }

  private getDefaultMetricValue(indicator: AthleteIndicatorDefinition): string | number {
    if (indicator.valueType === 'score') {
      return 3;
    }

    if (indicator.valueType === 'integer' || indicator.valueType === 'decimal') {
      return 0;
    }

    return '';
  }

  private getValidatorsForIndicator(indicator: AthleteIndicatorDefinition) {
    if (indicator.valueType === 'score') {
      return [Validators.required, Validators.min(1), Validators.max(5)];
    }

    if (indicator.valueType === 'integer') {
      return [Validators.required, Validators.min(0)];
    }

    if (indicator.valueType === 'decimal') {
      return [Validators.required, Validators.min(0)];
    }

    if (indicator.valueType === 'structured') {
      return [Validators.required, Validators.pattern(this.ratioRegex)];
    }

    return [Validators.required];
  }

  private buildPayload(): AthleteAssessmentPayload {
    const value = this.form.value;
    const metrics = this.getAllIndicators()
      .map((indicator) => this.buildMetricPayload(indicator, value[this.getMetricControlName(indicator)]))
      .filter((metric): metric is AthleteAssessmentMetricInput => Boolean(metric));

    return {
      athleteId: this.studentId,
      assessmentDate: value.assessmentDate,
      notes: value.generalNotes || '',
      metrics,
    };
  }

  private buildMetricPayload(
    indicator: AthleteIndicatorDefinition,
    rawValue: unknown
  ): AthleteAssessmentMetricInput | null {
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return null;
    }

    if (indicator.valueType === 'structured' || indicator.displayFormat === 'ratio') {
      const parsed = this.parseStructuredMetricValue(String(rawValue));
      if (!parsed) {
        return null;
      }

      return {
        metricCode: indicator.code,
        metricName: indicator.name,
        category: indicator.category,
        unit: indicator.unit,
        groupCode: indicator.groupCode,
        description: indicator.description,
        inputInstruction: indicator.inputInstruction,
        valueType: indicator.valueType,
        displayFormat: indicator.displayFormat,
        allowPeriodAggregation: indicator.allowPeriodAggregation,
        displayOrder: indicator.displayOrder,
        value: parsed.primaryValue,
        secondaryValue: parsed.secondaryValue,
        displayValue: `${parsed.primaryValue}:${parsed.secondaryValue ?? 0}`,
        structuredValue: parsed,
      };
    }

    const numericValue = Number(rawValue);
    if (Number.isNaN(numericValue)) {
      return null;
    }

    return {
      metricCode: indicator.code,
      metricName: indicator.name,
      category: indicator.category,
      unit: indicator.unit,
      groupCode: indicator.groupCode,
      description: indicator.description,
      inputInstruction: indicator.inputInstruction,
      valueType: indicator.valueType,
      displayFormat: indicator.displayFormat,
      allowPeriodAggregation: indicator.allowPeriodAggregation,
      displayOrder: indicator.displayOrder,
      value: numericValue,
      displayValue: String(numericValue),
    };
  }

  private parseStructuredMetricValue(rawValue: string) {
    const normalized = rawValue.trim();
    if (!this.ratioRegex.test(normalized)) {
      return null;
    }

    const [primary, secondary] = normalized.split(':').map((part) => Number(part.trim()));
    return {
      primaryValue: primary,
      secondaryValue: secondary,
    };
  }

  private getAllIndicators(): AthleteIndicatorDefinition[] {
    return this.indicatorGroups.flatMap((group) => group.indicators || []);
  }

  private getFallbackIndicatorGroups(): AthleteIndicatorGroup[] {
    return [
      {
        code: 'training',
        name: 'Treinamento',
        displayOrder: 1,
        isActive: true,
        indicators: [
          {
            code: 'overall_progress',
            name: 'Progresso geral',
            category: 'training',
            unit: 'score',
            valueType: 'score',
            displayFormat: 'score',
            allowPeriodAggregation: true,
            isActive: true,
            displayOrder: 1,
            groupCode: 'training',
          },
        ],
      },
      {
        code: 'technical',
        name: 'Técnica',
        displayOrder: 2,
        isActive: true,
        indicators: [
          {
            code: 'technical_score',
            name: 'Nota técnica',
            category: 'technical',
            unit: 'score',
            valueType: 'score',
            displayFormat: 'score',
            allowPeriodAggregation: true,
            isActive: true,
            displayOrder: 1,
            groupCode: 'technical',
          },
        ],
      },
      {
        code: 'physical',
        name: 'Físico',
        displayOrder: 3,
        isActive: true,
        indicators: [
          {
            code: 'physical_score',
            name: 'Nota física',
            category: 'physical',
            unit: 'score',
            valueType: 'score',
            displayFormat: 'score',
            allowPeriodAggregation: true,
            isActive: true,
            displayOrder: 1,
            groupCode: 'physical',
          },
        ],
      },
      {
        code: 'behavior',
        name: 'Comportamento',
        displayOrder: 4,
        isActive: true,
        indicators: [
          {
            code: 'behavior_score',
            name: 'Nota comportamental',
            category: 'psychological',
            unit: 'score',
            valueType: 'score',
            displayFormat: 'score',
            allowPeriodAggregation: true,
            isActive: true,
            displayOrder: 1,
            groupCode: 'behavior',
          },
        ],
      },
      {
        code: 'competition',
        name: 'Competição',
        displayOrder: 5,
        isActive: true,
        indicators: [
          {
            code: 'competition_count',
            name: 'Número de competições',
            category: 'competition',
            unit: 'count',
            valueType: 'integer',
            displayFormat: 'count',
            allowPeriodAggregation: true,
            isActive: true,
            displayOrder: 1,
            groupCode: 'competition',
          },
          {
            code: 'competition_record',
            name: 'Saldo competitivo',
            category: 'competition',
            unit: 'ratio',
            valueType: 'structured',
            displayFormat: 'ratio',
            allowPeriodAggregation: false,
            isActive: true,
            displayOrder: 2,
            groupCode: 'competition',
          },
        ],
      },
    ];
  }

  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
