import { Location } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { TrainingTechniquesOfflineService } from '../../services/training-techniques-offline.service';
import { TrainingTechniquesComponent } from './training-techniques.component';

describe('TrainingTechniquesComponent', () => {
  let component: TrainingTechniquesComponent;
  let fixture: ComponentFixture<TrainingTechniquesComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let offlineSpy: jasmine.SpyObj<TrainingTechniquesOfflineService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getSessionTechniques',
      'getProfessorTechniquePresets',
      'selectTechnique',
      'deselectTechnique',
      'addCustomTechnique',
      'saveTechniquePreset',
      'applyTechniquePreset',
    ]);

    offlineSpy = jasmine.createSpyObj<TrainingTechniquesOfflineService>('TrainingTechniquesOfflineService', [
      'enqueue',
      'flush',
    ]);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    apiSpy.getSessionTechniques.and.returnValue(
      of({
        selectedTechniqueIds: [],
        summary: { count: 0, names: [] },
        allTechniques: {
          byId: {
            't-1': { techniqueId: 't-1', name: 'Osoto Gari', category: 'Básica', displayOrder: 1 },
            't-2': { techniqueId: 't-2', name: 'Uchi Mata', category: 'Avançada', displayOrder: 10 },
          },
          categories: {
            Básica: ['t-1'],
            Avançada: ['t-2'],
          },
        },
      }) as any
    );

    apiSpy.getProfessorTechniquePresets.and.returnValue(of({ presets: [] }) as any);
    apiSpy.selectTechnique.and.returnValue(of({
      selectedTechniqueIds: ['t-1'],
      summary: { count: 1, names: ['Osoto Gari'] },
    }) as any);
    apiSpy.deselectTechnique.and.returnValue(of({ selectedTechniqueIds: [], summary: { count: 0, names: [] } }) as any);
    apiSpy.addCustomTechnique.and.returnValue(of({ technique: { techniqueId: 't-3', name: 'Teste', category: 'Avançada', displayOrder: 99 } }) as any);
    apiSpy.saveTechniquePreset.and.returnValue(of({ preset: { presetId: 'p-1', name: 'Preset', techniqueCount: 1, createdAt: new Date() } }) as any);
    apiSpy.applyTechniquePreset.and.returnValue(of({ selectedTechniqueIds: ['t-1'], summary: { count: 1, names: ['Osoto Gari'] } }) as any);

    offlineSpy.enqueue.and.returnValue(Promise.resolve());
    offlineSpy.flush.and.returnValue(Promise.resolve({ processed: 0, remaining: 0 }));

    await TestBed.configureTestingModule({
      declarations: [TrainingTechniquesComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: TrainingTechniquesOfflineService, useValue: offlineSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Location, useValue: jasmine.createSpyObj('Location', ['back']) },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ sessionId: 'session-1' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingTechniquesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega técnicas e monta grupos na inicialização', () => {
    expect(apiSpy.getSessionTechniques).toHaveBeenCalledWith('session-1');
    expect(component.techniqueGroups.length).toBe(2);
    expect(component.techniqueGroups[0].category).toBe('Básica');
  });

  it('bloqueia avanço para notas sem técnica selecionada', () => {
    component.selectedTechniqueIds.clear();
    component.onNextNotes();

    expect(component.infoMessage).toContain('Selecione pelo menos 1 técnica');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('faz autocomplete local sem chamada extra de API', () => {
    component.onCustomTechniqueInput('oso');

    expect(component.customAutocomplete.length).toBe(1);
    expect(component.customAutocomplete[0].name).toBe('Osoto Gari');
  });

  it('enfileira seleção quando offline', async () => {
    apiSpy.selectTechnique.and.returnValue(throwError(() => ({ status: 0 })) as any);
    spyOnProperty(navigator, 'onLine', 'get').and.returnValue(false);

    component.toggleTechnique('t-1');

    expect(offlineSpy.enqueue).toHaveBeenCalled();
    expect(component.selectedTechniqueIds.has('t-1')).toBeTrue();
  });
});
