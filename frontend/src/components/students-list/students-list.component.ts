import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { StudentProfile } from '../../types';

@Component({
  selector: 'app-students-list',
  standalone: false,
  templateUrl: './students-list.component.html',
  styleUrls: ['./students-list.component.scss'],
})
export class StudentsListComponent implements OnInit {
  students: StudentProfile[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  isMinorWithoutGuardianFilter = false;
  isWithoutHealthScreeningFilter = false;
  specialFilterTotal = 0;

  filterName = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  readonly isAdmin: boolean;
  private readonly isProfessor: boolean;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const user = this.auth.getCurrentUser();
    this.isAdmin = user?.role === 'Admin';
    this.isProfessor = user?.role === 'Professor';
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.isMinorWithoutGuardianFilter = params.get('filter') === 'minors-without-guardian' && this.isAdmin;
      this.isWithoutHealthScreeningFilter = params.get('filter') === 'students-without-health-screening' && this.isAdmin;
      this.loadStudents();
    });
  }

  loadStudents(): void {
    this.loading = true;
    this.errorMessage = '';
    this.specialFilterTotal = 0;

    if (this.isMinorWithoutGuardianFilter) {
      this.api.listMinorsWithoutGuardian().subscribe({
        next: (res) => {
          this.loading = false;
          this.specialFilterTotal = res.total || 0;
          this.students = (res.students || []).map((item) => ({
            id: item.studentId,
            fullName: item.fullName,
            email: '',
            role: 'Aluno',
            academyId: '',
            birthDate: item.birthDate,
            idade: item.idade,
            faixa: null,
            isMinor: true,
            isActive: item.isActive,
          }));
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.error || 'Erro ao carregar menores sem responsável.';
          this.students = [];
        },
      });
      return;
    }

    if (this.isWithoutHealthScreeningFilter) {
      this.api.listStudentsWithoutHealthScreening().subscribe({
        next: (res) => {
          this.loading = false;
          this.specialFilterTotal = res.total || 0;
          this.students = (res.students || []).map((item) => ({
            id: item.studentId,
            fullName: item.fullName,
            email: '',
            role: 'Aluno',
            academyId: '',
            birthDate: item.birthDate,
            idade: item.idade,
            faixa: item.faixa,
            isMinor: item.isMinor,
            isActive: item.isActive,
            operationalStatus: item.operationalStatus,
          }));
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.error || 'Erro ao carregar alunos sem anamnese.';
          this.students = [];
        },
      });
      return;
    }

    const request$ = this.isProfessor
      ? this.api.listMyStudents({
        name: this.filterName.trim() || undefined,
        status: this.filterStatus,
      })
      : this.api.listStudents({
        name: this.filterName.trim() || undefined,
        status: this.filterStatus,
      });

    request$.subscribe({
      next: (res) => {
        this.loading = false;
        this.students = res.students || [];
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.error || 'Erro ao carregar alunos.';
        this.students = [];
      },
    });
  }

  clearSpecialFilter(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filter: null },
      queryParamsHandling: 'merge',
    });
  }

  activateWithoutHealthScreeningFilter(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filter: 'students-without-health-screening' },
      queryParamsHandling: 'merge',
    });
  }

  goToNewStudent(): void {
    if (this.isProfessor) {
      this.router.navigate(['/professores/meus-alunos/novo']);
      return;
    }

    this.router.navigate(['/admin/alunos/novo']);
  }

  editStudent(studentId: string): void {
    if (this.isProfessor) {
      this.router.navigate(['/professores/meus-alunos', studentId, 'editar']);
      return;
    }

    this.router.navigate(['/admin/alunos', studentId, 'editar']);
  }

  viewFicha(studentId: string): void {
    if (this.isProfessor) {
      this.router.navigate(['/professores/meus-alunos', studentId, 'ficha']);
      return;
    }

    this.router.navigate(['/admin/alunos', studentId, 'ficha']);
  }

  goToHealthScreening(studentId: string): void {
    this.router.navigate(['/health-screening', studentId], {
      queryParams: { returnTo: this.router.url || '/admin/alunos' },
    });
  }

  getOperationalStatusLabel(student: StudentProfile): string {
    return student.operationalStatus?.isReady ? 'Completo' : 'Incompleto';
  }

  getOperationalMissingText(student: StudentProfile): string {
    const items = student.operationalStatus?.missingItems || [];
    return items.length === 0 ? 'Cadastro pronto para operacao' : `Faltando: ${items.join(', ')}`;
  }

  toggleStatus(student: StudentProfile): void {
    if (!this.isAdmin) {
      return;
    }

    const shouldActivate = student.isActive === false;
    const warning = shouldActivate
      ? `Ativar ${student.fullName}?`
      : `Desativar ${student.fullName}? O aluno nao conseguira mais fazer login.`;

    if (!window.confirm(warning)) {
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';

    this.api.updateStudentStatus(student.id, { isActive: shouldActivate }).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.loadStudents();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Erro ao atualizar status do aluno.';
      },
    });
  }

  goBack(): void {
    if (this.isProfessor) {
      this.router.navigate(['/home']);
      return;
    }

    this.router.navigate(['/admin/dashboard']);
  }
}
