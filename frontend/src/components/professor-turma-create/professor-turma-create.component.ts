import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { TurmaEligibleStudentItem, TurmaScheduleEntry } from '../../types';

@Component({
  selector: 'app-professor-turma-create',
  standalone: false,
  templateUrl: './professor-turma-create.component.html',
  styleUrls: ['./professor-turma-create.component.scss'],
})
export class ProfessorTurmaCreateComponent implements OnInit {
  turmaName = '';
  turmaDescription = '';
  weekday = 'Segunda-feira';
  startTime = '';
  endTime = '';

  isSaving = false;
  isLoadingStudents = false;
  successMessage = '';
  errorMessage = '';
  availableStudents: TurmaEligibleStudentItem[] = [];
  studentFilter = '';
  selectedStudentIds = new Set<string>();

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
    this.loadStudents();
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  goToManageTurmas(): void {
    this.router.navigate(['/professor/turmas']);
  }

  createTurma(): void {
    if (this.isSaving) {
      return;
    }

    const turmaName = this.turmaName.trim();
    if (!turmaName) {
      this.errorMessage = 'Informe o nome da turma.';
      this.successMessage = '';
      return;
    }

    if ((this.startTime && !this.endTime) || (!this.startTime && this.endTime)) {
      this.errorMessage = 'Informe horário inicial e final juntos.';
      this.successMessage = '';
      return;
    }

    if (this.startTime && this.endTime && this.endTime <= this.startTime) {
      this.errorMessage = 'Horário final deve ser maior que o horário inicial.';
      this.successMessage = '';
      return;
    }

    this.setSavingState(true);
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .createProfessorTurma({
        turmaName,
        description: this.turmaDescription.trim() || undefined,
        scheduleJson: this.buildScheduleJson(),
        studentIds: [...this.selectedStudentIds],
      })
      .pipe(
        timeout(10000),
        finalize(() => this.setSavingState(false))
      )
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.successMessage = response.message;
            this.turmaName = '';
            this.turmaDescription = '';
            this.weekday = 'Segunda-feira';
            this.startTime = '';
            this.endTime = '';
            this.selectedStudentIds.clear();
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.errorMessage = error?.error?.error || 'Não foi possível cadastrar a turma.';
            this.cdr.detectChanges();
          });
        },
      });
  }

  private buildScheduleJson(): TurmaScheduleEntry[] | undefined {
    if (!this.startTime || !this.endTime) {
      return undefined;
    }

    const entry: TurmaScheduleEntry = {
      day: this.weekday,
      startTime: this.startTime,
      endTime: this.endTime,
      time: `${this.startTime}-${this.endTime}`,
    };

    return [entry];
  }

  toggleStudentSelection(studentId: string): void {
    if (this.selectedStudentIds.has(studentId)) {
      this.selectedStudentIds.delete(studentId);
      return;
    }
    this.selectedStudentIds.add(studentId);
  }

  isStudentSelected(studentId: string): boolean {
    return this.selectedStudentIds.has(studentId);
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

  private loadStudents(): void {
    this.isLoadingStudents = true;

    this.api.listEligibleTurmaStudents().pipe(
      timeout(10000),
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

  private setSavingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isSaving = value;
      this.cdr.detectChanges();
    });
  }
}
