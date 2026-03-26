import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil, timeout } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import {
  ProfessorTurmaItem,
  TurmaEligibleStudentItem,
  UpdateProfessorTurmaPayload,
} from '../../types';

type TurmaFormState = {
  turmaName: string;
  description: string;
  day: string;
  startTime: string;
  endTime: string;
  studentIds: string[];
  isActive: boolean;
};

type TurmaRow = {
  turma: ProfessorTurmaItem;
  isSaving: boolean;
  successMessage: string;
  errorMessage: string;
  form: TurmaFormState;
};

type LinkedTurmaStudent = {
  studentId: string;
  fullName: string;
};

const WEEKDAY_ORDER: Record<string, number> = {
  'Segunda-feira': 0,
  'Terça-feira': 1,
  'Quarta-feira': 2,
  'Quinta-feira': 3,
  'Sexta-feira': 4,
  'Sábado': 5,
  'Domingo': 6,
};

@Component({
  selector: 'app-professor-turmas',
  standalone: false,
  templateUrl: './professor-turmas.component.html',
  styleUrls: ['./professor-turmas.component.scss'],
})
export class ProfessorTurmasComponent implements OnInit, OnDestroy {
  turmas: TurmaRow[] = [];
  selectedRow: TurmaRow | null = null;
  isLoading = false;
  isLoadingStudents = false;
  loadErrorMessage = '';
  availableStudents: TurmaEligibleStudentItem[] = [];
  studentFilter = '';

  private destroy$ = new Subject<void>();

  readonly weekdays = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo',
  ];

  constructor(
    private api: ApiService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEligibleStudents();
    this.loadTurmas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  loadTurmas(): void {
    this.setLoadingState(true);
    this.loadErrorMessage = '';

    this.api.listProfessorTurmas().pipe(
      timeout(10000),
      takeUntil(this.destroy$),
      finalize(() => this.setLoadingState(false))
    ).subscribe({
      next: (response) => {
        const rows: TurmaRow[] = (response.turmas || []).map((turma) => ({
          turma,
          isSaving: false,
          successMessage: '',
          errorMessage: '',
          form: this.toFormState(turma),
        }));
        rows.sort((a, b) => {
          const dayA = WEEKDAY_ORDER[a.form.day] ?? 99;
          const dayB = WEEKDAY_ORDER[b.form.day] ?? 99;
          return dayA - dayB;
        });
        this.turmas = rows;
      },
      error: (error) => {
        this.turmas = [];
        this.loadErrorMessage = error?.error?.error || 'Não foi possível carregar as turmas.';
      },
    });
  }

  selectTurma(row: TurmaRow): void {
    this.selectedRow = row;
    this.selectedRow.successMessage = '';
    this.selectedRow.errorMessage = '';
  }

  deselectTurma(): void {
    this.selectedRow = null;
  }

  dayAbbrev(day: string): string {
    const map: Record<string, string> = {
      'Segunda-feira': 'SEG', 'Terça-feira': 'TER', 'Quarta-feira': 'QUA',
      'Quinta-feira': 'QUI', 'Sexta-feira': 'SEX', 'Sábado': 'SÁB', 'Domingo': 'DOM',
    };
    return map[day] || day.slice(0, 3).toUpperCase();
  }

  saveTurma(row: TurmaRow): void {
    const turmaName = row.form.turmaName.trim();
    if (!turmaName) {
      row.errorMessage = 'Nome da turma é obrigatório.';
      row.successMessage = '';
      return;
    }

    if ((row.form.startTime && !row.form.endTime) || (!row.form.startTime && row.form.endTime)) {
      row.errorMessage = 'Informe horário inicial e final juntos.';
      row.successMessage = '';
      return;
    }

    if (row.form.startTime && row.form.endTime && row.form.endTime <= row.form.startTime) {
      row.errorMessage = 'Horário final deve ser maior que o horário inicial.';
      row.successMessage = '';
      return;
    }

    this.setRowSavingState(row, true);
    row.errorMessage = '';
    row.successMessage = '';

    const payload: UpdateProfessorTurmaPayload = {
      turmaName,
      description: row.form.description.trim() || undefined,
      isActive: row.form.isActive,
      scheduleJson: this.toScheduleJson(row.form),
      studentIds: [...row.form.studentIds],
    };

    this.api.updateProfessorTurma(row.turma.turmaId, payload).pipe(
      timeout(10000),
      takeUntil(this.destroy$),
      finalize(() => this.setRowSavingState(row, false))
    ).subscribe({
      next: (response) => {
        row.successMessage = response.message;
        row.turma = response.turma;
        row.form = this.toFormState(response.turma);
        // Re-sort grid after save in case day changed
        this.turmas.sort((a, b) => {
          const dayA = WEEKDAY_ORDER[a.form.day] ?? 99;
          const dayB = WEEKDAY_ORDER[b.form.day] ?? 99;
          return dayA - dayB;
        });
      },
      error: (error) => {
        row.errorMessage = error?.error?.error || 'Não foi possível salvar a turma.';
      },
    });
  }

  private toFormState(turma: ProfessorTurmaItem): TurmaFormState {
    const firstSchedule = Array.isArray(turma.scheduleJson) ? turma.scheduleJson[0] : turma.scheduleJson;
    const scheduleEntry = (firstSchedule || {}) as Record<string, string>;
    const startTime = scheduleEntry['startTime'] || scheduleEntry['start'] || '';
    const endTime = scheduleEntry['endTime'] || scheduleEntry['finish'] || '';
    const legacyTime = scheduleEntry['time'] || '';
    const [legacyStart, legacyEnd] = String(legacyTime).includes('-')
      ? String(legacyTime).split('-', 2)
      : [legacyTime, ''];

    return {
      turmaName: turma.turmaName || '',
      description: turma.description || '',
      day: scheduleEntry['day'] || 'Segunda-feira',
      startTime: startTime || legacyStart || '',
      endTime: endTime || legacyEnd || '',
      studentIds: [...(turma.studentIds || [])],
      isActive: turma.isActive,
    };
  }

  private toScheduleJson(form: TurmaFormState): any {
    const startTime = form.startTime.trim();
    const endTime = form.endTime.trim();
    if (!startTime || !endTime) {
      return undefined;
    }

    const entry: Record<string, string> = {
      day: form.day,
      startTime,
      endTime,
      time: `${startTime}-${endTime}`,
    };

    return [entry];
  }

  get filteredStudents(): TurmaEligibleStudentItem[] {
    const filter = this.studentFilter.trim().toLowerCase();
    if (!filter) {
      return this.availableStudents;
    }

    return this.availableStudents.filter((student) =>
      student.fullName.toLowerCase().includes(filter)
    );
  }

  toggleSelectedRowStudent(studentId: string): void {
    if (!this.selectedRow) {
      return;
    }

    if (this.selectedRow.form.studentIds.includes(studentId)) {
      this.selectedRow.form.studentIds = this.selectedRow.form.studentIds.filter((id) => id !== studentId);
      return;
    }

    this.selectedRow.form.studentIds = [...this.selectedRow.form.studentIds, studentId];
  }

  isSelectedRowStudent(studentId: string): boolean {
    if (!this.selectedRow) {
      return false;
    }

    return this.selectedRow.form.studentIds.includes(studentId);
  }

  get linkedStudentsForSelectedRow(): LinkedTurmaStudent[] {
    if (!this.selectedRow) {
      return [];
    }

    return this.selectedRow.form.studentIds.map((studentId) => {
      const linked = this.availableStudents.find((student) => student.studentId === studentId);
      return {
        studentId,
        fullName: linked?.fullName || 'Aluno vinculado',
      };
    });
  }

  unlinkStudentFromSelectedRow(studentId: string): void {
    if (!this.selectedRow || this.selectedRow.isSaving) {
      return;
    }

    this.selectedRow.form.studentIds = this.selectedRow.form.studentIds.filter((id) => id !== studentId);
  }

  private loadEligibleStudents(): void {
    this.isLoadingStudents = true;

    this.api.listEligibleTurmaStudents().pipe(
      timeout(10000),
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoadingStudents = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.availableStudents = response.students || [];
      },
      error: () => {
        this.availableStudents = [];
      },
    });
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }

  private setRowSavingState(row: TurmaRow, value: boolean): void {
    this.ngZone.run(() => {
      row.isSaving = value;
      this.cdr.detectChanges();
    });
  }
}
