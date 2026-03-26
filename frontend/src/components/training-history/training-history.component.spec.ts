import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Subject, of, throwError } from 'rxjs';

import { TrainingHistoryComponent } from './training-history.component';
import { ApiService } from '../../services/api.service';
import { TrainingHistoryItem, TrainingDetailsResponse } from '../../types';

const mockTraining: TrainingHistoryItem = {
  session_id: 'session-001',
  session_date: '2025-01-15',
  session_time: '18:00:00',
  turma_name: 'Turma A',
  present_count: 5,
  total_count: 8,
  technique_names: ['Osoto Gari', 'Seoi Nage'],
  notes: 'Treinou bem',
  created_at: '2025-01-15T18:00:00Z',
  updated_at: '2025-01-15T20:00:00Z',
};

const mockDetails: TrainingDetailsResponse = {
  session_id: 'session-001',
  turma_id: 'turma-001',
  professor_id: 'prof-001',
  session_date: '2025-01-15',
  session_time: '18:00:00',
  duration_minutes: 60,
  notes: 'Treinou bem',
  turma_name: 'Turma A',
  created_at: '2025-01-15T18:00:00Z',
  updated_at: '2025-01-15T20:00:00Z',
  deleted_at: null,
  attendance: [
    { student_id: 'stu-001', student_name: 'Aluno 1', status: 'present' },
    { student_id: 'stu-002', student_name: 'Aluno 2', status: 'absent' },
  ],
};

describe('TrainingHistoryComponent', () => {
  let component: TrainingHistoryComponent;
  let fixture: ComponentFixture<TrainingHistoryComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;

  const mockHistoryResponse = {
    success: true,
    data: {
      trainings: [mockTraining],
      total: 1,
      page: 1,
      pageSize: 20,
    },
  };

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getTrainingHistory',
      'getTrainingDetails',
      'updateTraining',
      'deleteTraining',
      'restoreTraining',
    ]);
    apiSpy.getTrainingHistory.and.returnValue(of(mockHistoryResponse));
    apiSpy.getTrainingDetails.and.returnValue(of({ success: true, data: mockDetails }));
    apiSpy.updateTraining.and.returnValue(of({ success: true, data: mockDetails }));
    apiSpy.deleteTraining.and.returnValue(
      of({ success: true, data: { undo_deadline: new Date(Date.now() + 30000).toISOString() } })
    );
    apiSpy.restoreTraining.and.returnValue(of({ success: true, data: mockDetails }));

    await TestBed.configureTestingModule({
      declarations: [TrainingHistoryComponent],
      imports: [FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: ApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve carregar histórico ao inicializar', () => {
    expect(apiSpy.getTrainingHistory).toHaveBeenCalled();
    expect(component.trainings.length).toBe(1);
    expect(component.total).toBe(1);
  });

  it('deve exibir erro ao falhar ao carregar', fakeAsync(() => {
    apiSpy.getTrainingHistory.and.returnValue(throwError(() => new Error('Error')));
    component.loadHistory();
    tick();
    expect(component.errorMessage).toContain('Erro ao carregar');
  }));

  it('deve aplicar filtros e recarregar', () => {
    component.filterKeyword = 'Osoto';
    component.applyFilters();
    expect(apiSpy.getTrainingHistory).toHaveBeenCalledTimes(2);
    expect(component.page).toBe(1);
  });

  it('deve limpar filtros e recarregar', () => {
    component.filterKeyword = 'test';
    component.filterDateFrom = '2025-01-01';
    component.clearFilters();
    expect(component.filterKeyword).toBe('');
    expect(component.filterDateFrom).toBe('');
    expect(apiSpy.getTrainingHistory).toHaveBeenCalledTimes(2);
  });

  it('deve carregar detalhes ao chamar viewDetails', () => {
    component.viewDetails('session-001');
    expect(apiSpy.getTrainingDetails).toHaveBeenCalledWith('session-001');
    expect(component.selectedTraining).toEqual(mockDetails);
  });

  it('deve fechar detalhes ao chamar closeDetail', () => {
    component.selectedTraining = mockDetails;
    component.closeDetail();
    expect(component.selectedTraining).toBeNull();
  });

  it('deve abrir modal de edição com texto atual', () => {
    component.selectedTraining = mockDetails;
    component.openEditModal();
    expect(component.showEditModal).toBeTrue();
    expect(component.editNotes).toBe('Treinou bem');
  });

  it('deve salvar edição e recarregar', () => {
    component.selectedTraining = { ...mockDetails };
    component.openEditModal();
    component.editNotes = 'Nova observação';
    component.saveEdit();

    expect(apiSpy.updateTraining).toHaveBeenCalledWith('session-001', { notes: 'Nova observação' });
    expect(component.showEditModal).toBeFalse();
  });

  it('deve mostrar erro ao tentar salvar edição vazia', () => {
    component.selectedTraining = mockDetails;
    component.openEditModal();
    component.editNotes = '   ';
    component.saveEdit();
    expect(component.editError).toBeTruthy();
    expect(apiSpy.updateTraining).not.toHaveBeenCalled();
  });

  it('deve excluir treino e iniciar contagem regressiva', fakeAsync(() => {
    component.selectedTraining = { ...mockDetails };
    component.openDeleteModal();
    component.confirmDelete();
    tick();

    expect(apiSpy.deleteTraining).toHaveBeenCalledWith('session-001');
    expect(component.deletedSessionId).toBe('session-001');
    expect(component.showDeleteModal).toBeFalse();
    expect(component.undoCountdown).toBeGreaterThan(0);
    component.ngOnDestroy(); // clear timer
  }));

  it('deve desfazer exclusão chamando restoreTraining', fakeAsync(() => {
    component.deletedSessionId = 'session-001';
    component.undoDeadline = new Date(Date.now() + 30000);
    component.undoCountdown = 30;
    component.undoDelete();
    tick();

    expect(apiSpy.restoreTraining).toHaveBeenCalledWith('session-001');
    expect(component.deletedSessionId).toBe('');
  }));

  it('deve calcular totalPages corretamente', () => {
    component.total = 45;
    component.pageSize = 20;
    expect(component.totalPages).toBe(3);
  });

  it('deve navegar para próxima página', () => {
    component.total = 40;
    component.pageSize = 20;
    component.page = 1;
    component.nextPage();
    expect(component.page).toBe(2);
    expect(apiSpy.getTrainingHistory).toHaveBeenCalledTimes(2);
  });

  it('deve navegar para página anterior', () => {
    component.page = 2;
    component.prevPage();
    expect(component.page).toBe(1);
  });

  it('deve formatar data corretamente', () => {
    const result = component.formatDate('2025-01-15');
    expect(result).toContain('2025');
  });

  it('deve formatar hora corretamente', () => {
    expect(component.formatTime('18:00:00')).toBe('18:00');
  });

  it('deve exibir label de presença', () => {
    expect(component.getAttendanceLabel(5, 8)).toBe('5/8 presentes');
  });
});
