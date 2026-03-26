import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, flush, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';

import { TrainingSuccessComponent } from './training-success.component';

const ISO_NOW = '2026-03-25T19:47:00.000Z';

describe('TrainingSuccessComponent', () => {
  describe('estado inicial (sem timers)', () => {
    let component: TrainingSuccessComponent;
    let fixture: ComponentFixture<TrainingSuccessComponent>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
      routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

      await TestBed.configureTestingModule({
        declarations: [TrainingSuccessComponent],
        schemas: [NO_ERRORS_SCHEMA],
        providers: [
          { provide: Router, useValue: routerSpy },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: convertToParamMap({ sessionId: 'session-abc' }),
                queryParamMap: convertToParamMap({ confirmedAt: ISO_NOW, studentsNotified: 'false' }),
              },
            },
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TrainingSuccessComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    afterEach(() => {
      component.ngOnDestroy();
    });

    it('lê sessionId de rota ao inicializar', () => {
      expect(component.sessionId).toBe('session-abc');
    });

    it('ctasVisible começa como false', () => {
      expect(component.ctasVisible).toBeFalse();
    });

    it('mostra "Registro confirmado." quando studentsNotified=false', () => {
      expect(component.notificationText).toBe('Registro confirmado.');
    });

    it('navega para /home ao clicar Voltar ao Painel (AC4)', () => {
      component.onVoltarPainel();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('navega para entry-point ao clicar Próxima Aula (AC3)', () => {
      component.onProximaAula();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/training/entry-point']);
    });
  });

  describe('studentsNotified=true', () => {
    let component: TrainingSuccessComponent;
    let fixture: ComponentFixture<TrainingSuccessComponent>;

    beforeEach(async () => {
      const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

      await TestBed.configureTestingModule({
        declarations: [TrainingSuccessComponent],
        schemas: [NO_ERRORS_SCHEMA],
        providers: [
          { provide: Router, useValue: routerSpy },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: convertToParamMap({ sessionId: 'session-abc' }),
                queryParamMap: convertToParamMap({ confirmedAt: ISO_NOW, studentsNotified: 'true' }),
              },
            },
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TrainingSuccessComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    afterEach(() => {
      component.ngOnDestroy();
    });

    it('mostra "Alunos foram notificados ✓" quando studentsNotified=true', () => {
      expect(component.notificationText).toBe('Alunos foram notificados ✓');
    });
  });

  describe('timers (fakeAsync)', () => {
    let component: TrainingSuccessComponent;
    let fixture: ComponentFixture<TrainingSuccessComponent>;
    let routerSpy: jasmine.SpyObj<Router>;

    // Configure TestBed once for all timer tests (same providers, same route params)
    beforeEach(async () => {
      routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

      await TestBed.configureTestingModule({
        declarations: [TrainingSuccessComponent],
        schemas: [NO_ERRORS_SCHEMA],
        providers: [
          { provide: Router, useValue: routerSpy },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: convertToParamMap({ sessionId: 'session-abc' }),
                queryParamMap: convertToParamMap({ confirmedAt: ISO_NOW, studentsNotified: 'false' }),
              },
            },
          },
        ],
      }).compileComponents();
    });

    // Each fakeAsync test creates its own fixture + calls detectChanges INSIDE fakeAsync zone
    // so that the timers scheduled during ngOnInit are registered in the fake clock.
    it('destaca CTAs após 3 segundos (AC2)', fakeAsync(() => {
      fixture = TestBed.createComponent(TrainingSuccessComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.ctasVisible).toBeFalse();
      tick(3000);
      expect(component.ctasVisible).toBeTrue();
      component.ngOnDestroy();
      flush();
    }));

    it('não destaca CTAs antes de 3 segundos', fakeAsync(() => {
      fixture = TestBed.createComponent(TrainingSuccessComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      tick(2999);
      expect(component.ctasVisible).toBeFalse();
      component.ngOnDestroy();
      flush();
    }));

    it('inicia contagem regressiva após 60 segundos (AC6)', fakeAsync(() => {
      fixture = TestBed.createComponent(TrainingSuccessComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      tick(60000);
      expect(component.redirectCountdown).toBe(5);
      tick(1000);
      expect(component.redirectCountdown).toBe(4);
      component.ngOnDestroy();
      flush();
    }));

    it('redireciona ao painel após countdown completar (AC6)', fakeAsync(() => {
      fixture = TestBed.createComponent(TrainingSuccessComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      tick(60000); // inactivity timer fires → starts countdown at 5
      tick(5000);  // 5 × 1 s interval ticks → countdown reaches 0 → navigate
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
      component.ngOnDestroy();
    }));

    it('cancela redirect ao chamar cancelRedirect() (AC6)', fakeAsync(() => {
      fixture = TestBed.createComponent(TrainingSuccessComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      tick(60000);
      expect(component.redirectCountdown).toBe(5);
      component.cancelRedirect();
      tick(10000);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
      expect(component.redirectCountdown).toBe(0);
      expect(component.redirectCancelled).toBeTrue();
      component.ngOnDestroy();
    }));

    it('limpa timers no ngOnDestroy sem erros (AC5)', fakeAsync(() => {
      fixture = TestBed.createComponent(TrainingSuccessComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.ngOnDestroy();
      flush();
      expect(component['ctaTimer']).toBeNull();
      expect(component['inactivityTimer']).toBeNull();
    }));
  });
});
