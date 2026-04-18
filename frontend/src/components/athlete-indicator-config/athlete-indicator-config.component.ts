import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';

import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import {
  AthleteIndicatorDefinition,
  AthleteIndicatorGroup,
  AthleteMetricCategory,
  AthleteMetricValueType,
  User,
} from '../../types';

@Component({
  selector: 'app-athlete-indicator-config',
  standalone: false,
  templateUrl: './athlete-indicator-config.component.html',
  styleUrls: ['./athlete-indicator-config.component.scss'],
})
export class AthleteIndicatorConfigComponent implements OnInit {
  currentUser: User | null = null;
  groups: AthleteIndicatorGroup[] = [];
  selectedGroupIndex = 0;
  selectedIndicatorIndex: number | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  readonly categoryOptions: Array<{ value: AthleteMetricCategory; label: string }> = [
    { value: 'training', label: 'Treinamento' },
    { value: 'technical', label: 'Técnica' },
    { value: 'physical', label: 'Físico' },
    { value: 'tactical', label: 'Tática' },
    { value: 'psychological', label: 'Mental / comportamento' },
    { value: 'competition', label: 'Competição' },
  ];

  readonly valueTypeOptions: Array<{ value: AthleteMetricValueType; label: string }> = [
    { value: 'score', label: 'Nota de 1 a 5' },
    { value: 'integer', label: 'Número inteiro' },
    { value: 'decimal', label: 'Número decimal' },
    { value: 'structured', label: 'Estruturado (ex.: 10:2)' },
  ];

  readonly displayFormatOptions = [
    { value: 'score', label: 'Score' },
    { value: 'integer', label: 'Inteiro' },
    { value: 'decimal', label: 'Decimal' },
    { value: 'count', label: 'Contagem' },
    { value: 'percent', label: 'Percentual' },
    { value: 'ratio', label: 'Razão (10:2)' },
    { value: 'text', label: 'Texto' },
  ];

  private readonly groupTrackKeys = new WeakMap<AthleteIndicatorGroup, string>();
  private readonly indicatorTrackKeys = new WeakMap<AthleteIndicatorDefinition, string>();
  private trackKeySequence = 0;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();

    if (!this.canManage()) {
      this.errorMessage = 'Somente professor ou administrador pode cadastrar indicadores.';
      return;
    }

    this.loadConfiguration();
  }

  canManage(): boolean {
    return this.currentUser?.role === 'Professor' || this.currentUser?.role === 'Admin';
  }

  loadConfiguration(): void {
    this.setLoadingState(true);
    this.errorMessage = '';

    this.api.getAthleteIndicatorConfiguration().pipe(
      timeout(10000),
      finalize(() => this.setLoadingState(false))
    ).subscribe({
      next: (groups) => {
        this.groups = groups?.length ? this.cloneGroups(groups) : [];

        if (!this.groups.length) {
          this.addGroup();
        } else {
          this.ensureSelection();
        }

        this.refreshView();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Não foi possível carregar a configuração dos indicadores.';
        this.refreshView();
      },
    });
  }

  addGroup(): void {
    const nextIndex = this.groups.length + 1;
    this.groups.push({
      code: `grupo_${nextIndex}`,
      name: `Novo grupo ${nextIndex}`,
      description: '',
      displayOrder: nextIndex,
      isActive: true,
      indicators: [],
    });
    this.selectGroup(this.groups.length - 1, true);
  }

  removeGroup(index: number): void {
    this.groups.splice(index, 1);
    this.ensureSelection();
    this.refreshView();
  }

  addIndicator(group: AthleteIndicatorGroup): void {
    const nextIndex = group.indicators.length + 1;
    group.indicators.push({
      code: `${this.slugify(group.code || group.name || 'indicador')}_${nextIndex}`,
      name: `Novo indicador ${nextIndex}`,
      category: 'training',
      unit: 'score',
      valueType: 'score',
      displayFormat: 'score',
      description: '',
      inputInstruction: '',
      allowPeriodAggregation: true,
      isActive: true,
      displayOrder: nextIndex,
      groupCode: group.code || this.slugify(group.name || 'grupo'),
    });

    const groupIndex = this.groups.indexOf(group);
    if (groupIndex >= 0) {
      this.selectIndicator(groupIndex, group.indicators.length - 1);
    }
  }

  removeIndicator(group: AthleteIndicatorGroup, index: number): void {
    group.indicators.splice(index, 1);
    this.ensureSelection();
    this.refreshView();
  }

  selectGroup(groupIndex: number, editGroup: boolean = true): void {
    this.selectedGroupIndex = groupIndex;
    const group = this.groups[groupIndex];
    this.selectedIndicatorIndex = editGroup ? null : (group?.indicators?.length ? 0 : null);
    this.refreshView();
  }

  selectIndicator(groupIndex: number, indicatorIndex: number): void {
    this.selectedGroupIndex = groupIndex;
    this.selectedIndicatorIndex = indicatorIndex;
    this.refreshView();
  }

  isGroupSelected(groupIndex: number): boolean {
    return this.selectedGroupIndex === groupIndex && this.selectedIndicatorIndex === null;
  }

  isIndicatorSelected(groupIndex: number, indicatorIndex: number): boolean {
    return this.selectedGroupIndex === groupIndex && this.selectedIndicatorIndex === indicatorIndex;
  }

  getSelectedGroup(): AthleteIndicatorGroup | null {
    return this.groups[this.selectedGroupIndex] || null;
  }

  getSelectedIndicator(): AthleteIndicatorDefinition | null {
    const group = this.getSelectedGroup();
    if (!group || this.selectedIndicatorIndex === null) {
      return null;
    }

    return group.indicators[this.selectedIndicatorIndex] || null;
  }

  removeSelectedIndicator(): void {
    const group = this.getSelectedGroup();
    if (!group || this.selectedIndicatorIndex === null) {
      return;
    }

    this.removeIndicator(group, this.selectedIndicatorIndex);
  }

  save(): void {
    if (!this.canManage()) {
      this.errorMessage = 'Somente professor ou administrador pode cadastrar indicadores.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.buildPayload();
    if (!payload.length) {
      this.errorMessage = 'Cadastre pelo menos um grupo antes de salvar.';
      return;
    }

    this.setSavingState(true);
    this.api.updateAthleteIndicatorConfiguration(payload).pipe(
      timeout(10000),
      finalize(() => this.setSavingState(false))
    ).subscribe({
      next: (groups) => {
        this.groups = this.cloneGroups(groups || []);
        this.successMessage = 'Indicadores atualizados com sucesso.';
        this.refreshView();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Não foi possível salvar os indicadores.';
        this.refreshView();
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/home'], { queryParams: { highlight: 'athlete-progress' } });
  }

  readonly trackByGroup = (_: number, group: AthleteIndicatorGroup): string =>
    this.getStableTrackKey(this.groupTrackKeys, group, 'group');

  readonly trackByIndicator = (_: number, indicator: AthleteIndicatorDefinition): string =>
    this.getStableTrackKey(this.indicatorTrackKeys, indicator, 'indicator');

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }

  private setSavingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isSaving = value;
      this.cdr.detectChanges();
    });
  }

  private refreshView(): void {
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
  }

  private getStableTrackKey<T extends object>(store: WeakMap<T, string>, item: T, prefix: string): string {
    let key = store.get(item);
    if (!key) {
      this.trackKeySequence += 1;
      key = `${prefix}_${this.trackKeySequence}`;
      store.set(item, key);
    }
    return key;
  }

  private ensureSelection(): void {
    if (!this.groups.length) {
      this.selectedGroupIndex = 0;
      this.selectedIndicatorIndex = null;
      return;
    }

    if (this.selectedGroupIndex >= this.groups.length || this.selectedGroupIndex < 0) {
      this.selectedGroupIndex = 0;
    }

    const group = this.groups[this.selectedGroupIndex];
    if (!group.indicators.length) {
      this.selectedIndicatorIndex = null;
      return;
    }

    if (this.selectedIndicatorIndex === null) {
      return;
    }

    if (this.selectedIndicatorIndex >= group.indicators.length || this.selectedIndicatorIndex < 0) {
      this.selectedIndicatorIndex = group.indicators.length - 1;
    }
  }

  private buildPayload(): AthleteIndicatorGroup[] {
    return this.groups
      .map((group, groupIndex) => {
        const groupCode = this.slugify(group.code || group.name || `grupo_${groupIndex + 1}`);
        const indicators = (group.indicators || [])
          .filter((indicator) => (indicator.name || '').trim().length > 0)
          .map((indicator, indicatorIndex) => ({
            ...indicator,
            code: this.slugify(indicator.code || indicator.name || `indicador_${indicatorIndex + 1}`),
            name: (indicator.name || '').trim(),
            category: indicator.category || 'training',
            unit: (indicator.unit || 'score').trim(),
            valueType: indicator.valueType || 'score',
            displayFormat: indicator.displayFormat || 'score',
            description: (indicator.description || '').trim(),
            inputInstruction: (indicator.inputInstruction || '').trim(),
            allowPeriodAggregation: indicator.allowPeriodAggregation !== false,
            isActive: indicator.isActive !== false,
            displayOrder: Number(indicator.displayOrder || indicatorIndex + 1),
            groupCode,
          }));

        return {
          code: groupCode,
          name: (group.name || '').trim() || `Grupo ${groupIndex + 1}`,
          description: (group.description || '').trim(),
          displayOrder: Number(group.displayOrder || groupIndex + 1),
          isActive: group.isActive !== false,
          indicators,
        };
      })
      .filter((group) => group.name.length > 0);
  }

  private cloneGroups(groups: AthleteIndicatorGroup[]): AthleteIndicatorGroup[] {
    return JSON.parse(JSON.stringify(groups));
  }

  private slugify(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'indicador';
  }
}
