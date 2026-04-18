import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AthleteIndicatorConfigComponent } from './athlete-indicator-config.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

describe('AthleteIndicatorConfigComponent', () => {
  let component: AthleteIndicatorConfigComponent;
  let fixture: ComponentFixture<AthleteIndicatorConfigComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getAthleteIndicatorConfiguration',
      'updateAthleteIndicatorConfiguration',
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser']);

    authSpy.getCurrentUser.and.returnValue({ id: 'prof-1', role: 'Professor', fullName: 'Professor Teste' } as any);
    apiSpy.getAthleteIndicatorConfiguration.and.returnValue(of([
      {
        code: 'technical',
        name: 'Técnica',
        description: 'Base técnica do atleta',
        displayOrder: 1,
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
    ]) as any);
    apiSpy.updateAthleteIndicatorConfiguration.and.returnValue(of([] as any));

    await TestBed.configureTestingModule({
      declarations: [AthleteIndicatorConfigComponent],
      imports: [FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AthleteIndicatorConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega a configuração inicial para professor ou admin', () => {
    expect(apiSpy.getAthleteIndicatorConfiguration).toHaveBeenCalled();
    expect(component.groups.length).toBe(1);
    expect(component.groups[0].code).toBe('technical');
  });

  it('mantém a identidade do indicador estável ao editar o código', () => {
    const group = component.groups[0];
    const indicator = group.indicators[0];

    const firstKey = component.trackByIndicator(0, indicator);
    indicator.code = 'technical_score_updated';
    const secondKey = component.trackByIndicator(0, indicator);

    expect(secondKey).toBe(firstKey);
  });

  it('seleciona um indicador da lista para edição ao clicar', () => {
    const group = component.groups[0];
    const indicator = group.indicators[0];

    component.selectIndicator(0, 0);

    expect(component.getSelectedGroup()).toBe(group);
    expect(component.getSelectedIndicator()).toBe(indicator);
    expect(component.isIndicatorSelected(0, 0)).toBeTrue();
  });

  it('permite adicionar um novo indicador e salvar a configuração', () => {
    component.addGroup();
    const newGroup = component.groups[component.groups.length - 1];
    newGroup.code = 'competition';
    newGroup.name = 'Competição';

    component.addIndicator(newGroup);
    const newIndicator = newGroup.indicators[0];
    newIndicator.code = 'competition_count';
    newIndicator.name = 'Número de competições';
    newIndicator.category = 'competition';
    newIndicator.groupCode = 'competition';

    component.save();

    expect(apiSpy.updateAthleteIndicatorConfiguration).toHaveBeenCalled();
  });
});
