import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import {
  TrainingAttendanceResponse,
  TrainingAttendanceStatus,
  TrainingAttendanceStudent,
} from '../../types';

@Component({
  selector: 'app-training-attendance',
  standalone: false,
  templateUrl: './training-attendance.component.html',
  styleUrls: ['./training-attendance.component.scss'],
})
export class TrainingAttendanceComponent implements OnInit {
  sessionId = '';
  turmaId = '';
  turmaName = '';
  students: TrainingAttendanceStudent[] = [];
  total = 0;
  present = 0;

  isLoading = false;
  savingStudentIds = new Set<string>();
  errorMessage = '';
  infoMessage = '';

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  get isSaving(): boolean {
    return this.savingStudentIds.size > 0;
  }

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    if (!this.sessionId) {
      this.errorMessage = 'Sessão inválida para marcar frequência.';
      return;
    }

    this.loadAttendance();
  }

  loadAttendance(): void {
    this.setLoadingState(true);
    this.errorMessage = '';
    this.infoMessage = '';

    this.api
      .getTrainingAttendance(this.sessionId)
      .pipe(
        timeout(10000),
        finalize(() => {
          this.setLoadingState(false);
        })
      )
      .subscribe({
        next: (response: TrainingAttendanceResponse) => {
          this.applyAttendance(response);
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.error || 'Não foi possível carregar a frequência da sessão.';
        },
      });
  }

  private applyAttendance(response: TrainingAttendanceResponse): void {
    this.turmaId = response.turmaId;
    this.turmaName = response.turmaName;
    this.students = response.students;
    this.total = response.totals.total;
    this.present = response.totals.present;
  }

  onSelectStatus(student: TrainingAttendanceStudent, nextStatus: TrainingAttendanceStatus): void {
    if (this.savingStudentIds.has(student.studentId) || student.status === nextStatus) {
      return;
    }

    const previousStatus = student.status;

    // Feedback visual imediato (otimista)
    student.status = nextStatus;
    this.present = this.students.filter((item) => item.status === 'present').length;
    this.setStudentSavingState(student.studentId, true);
    this.errorMessage = '';

    const localWarning = nextStatus === 'present' && !student.hasHealthScreening
      ? `⚠️ ${student.studentName} não tem anamnese preenchida. Recomendamos preencher antes de registrar treino.`
      : '';

    if (localWarning) {
      this.infoMessage = localWarning;
    }

    this.api
      .saveTrainingAttendance(this.sessionId, {
        studentId: student.studentId,
        status: nextStatus,
      })
      .pipe(
        timeout(10000),
        finalize(() => {
          this.setStudentSavingState(student.studentId, false);
        })
      )
      .subscribe({
        next: (response) => {
          this.total = response.totals.total;
          this.present = response.totals.present;
          this.infoMessage = response.warning || localWarning || '';
        },
        error: (error) => {
          student.status = previousStatus;
          this.present = this.students.filter((item) => item.status === 'present').length;
          this.errorMessage =
            error?.error?.error || 'Falha ao salvar frequência. Tente novamente.';
        },
      });
  }

  isStudentSaving(studentId: string): boolean {
    return this.savingStudentIds.has(studentId);
  }

  onBackToReview(): void {
    this.location.back();
  }

  onBackToHome(): void {
    this.router.navigate(['/home']);
  }

  onNextTechniques(): void {
    if (this.isSaving) {
      this.infoMessage = 'Aguarde a conclusão do salvamento antes de avançar.';
      return;
    }

    if (this.present < 1) {
      this.infoMessage = 'Marque pelo menos 1 aluno como presente para avançar.';
      return;
    }

    this.infoMessage = '';
    this.router.navigate(['/training/session', this.sessionId, 'techniques']);
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }

  private setStudentSavingState(studentId: string, value: boolean): void {
    this.ngZone.run(() => {
      if (value) {
        this.savingStudentIds.add(studentId);
      } else {
        this.savingStudentIds.delete(studentId);
      }
      this.cdr.detectChanges();
    });
  }
}
