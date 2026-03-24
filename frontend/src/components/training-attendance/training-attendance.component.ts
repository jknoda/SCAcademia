import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
    private api: ApiService
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
    this.isLoading = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.api.getTrainingAttendance(this.sessionId).subscribe({
      next: (response: TrainingAttendanceResponse) => {
        this.applyAttendance(response);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.error || 'Não foi possível carregar a frequência da sessão.';
        this.isLoading = false;
      },
    });
  }

  private applyAttendance(response: TrainingAttendanceResponse): void {
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
    this.savingStudentIds.add(student.studentId);
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
      .subscribe({
        next: (response) => {
          this.total = response.totals.total;
          this.present = response.totals.present;
          this.infoMessage = response.warning || localWarning || '';
          this.savingStudentIds.delete(student.studentId);
        },
        error: (error) => {
          student.status = previousStatus;
          this.present = this.students.filter((item) => item.status === 'present').length;
          this.errorMessage =
            error?.error?.error || 'Falha ao salvar frequência. Tente novamente.';
          this.savingStudentIds.delete(student.studentId);
        },
      });
  }

  isStudentSaving(studentId: string): boolean {
    return this.savingStudentIds.has(studentId);
  }

  onBackToReview(): void {
    this.location.back();
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
}
