import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SetupComponent } from './components/setup/setup.component';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { RegisterFormComponent } from './components/register-form/register-form.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ForgotPasswordFormComponent } from './components/forgot-password-form/forgot-password-form.component';
import { ResetPasswordFormComponent } from './components/reset-password-form/reset-password-form.component';
import { HealthScreeningFormComponent } from './components/health-screening-form/health-screening-form.component';
import { HomeComponent } from './components/home/home.component';
import { ConsentWizardComponent } from './components/consent-wizard/consent-wizard.component';
import { ConsentTemplatesAdminComponent } from './components/consent-templates-admin/consent-templates-admin.component';
import { AuditLogComponent } from './components/audit-log/audit-log.component';
import { ComplianceReportsSettingsComponent } from './components/compliance-reports-settings/compliance-reports-settings.component';
import { TrainingAttendancePlaceholderComponent } from './components/training-attendance-placeholder/training-attendance-placeholder.component';
import { TrainingAttendanceComponent } from './components/training-attendance/training-attendance.component';
import { AcademyProfileComponent } from './components/academy-profile/academy-profile.component';
import { AdminProfileComponent } from './components/admin-profile/admin-profile.component';
import { ProfessorsListComponent } from './components/professors-list/professors-list.component';
import { ProfessorFormComponent } from './components/professor-form/professor-form.component';
import { StudentsListComponent } from './components/students-list/students-list.component';
import { StudentFormComponent } from './components/student-form/student-form.component';
import { StudentProfileComponent } from './components/student-profile/student-profile.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  { path: '', redirectTo: '/setup', pathMatch: 'full' },
  { path: 'setup', component: SetupComponent },
  { path: 'login', component: LoginFormComponent },
  { path: 'register', component: RegisterFormComponent },
  { path: 'forgot-password', component: ForgotPasswordFormComponent },
  { path: 'reset-password', component: ResetPasswordFormComponent },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard, RoleGuard] },
  { path: 'admin/perfil-academia', component: AcademyProfileComponent, canActivate: [AuthGuard, RoleGuard] },
  { path: 'admin/meu-perfil', component: AdminProfileComponent, canActivate: [AuthGuard, RoleGuard] },
  { path: 'admin/professores', component: ProfessorsListComponent, canActivate: [AuthGuard, RoleGuard] },
  { path: 'admin/professores/novo', component: ProfessorFormComponent, canActivate: [AuthGuard, RoleGuard] },
  { path: 'admin/professores/:id/editar', component: ProfessorFormComponent, canActivate: [AuthGuard, RoleGuard] },
  { path: 'admin/alunos', component: StudentsListComponent, canActivate: [AuthGuard, RoleGuard] },
  { path: 'admin/alunos/novo', component: StudentFormComponent, canActivate: [AuthGuard, RoleGuard] },
  { path: 'admin/alunos/:id/editar', component: StudentFormComponent, canActivate: [AuthGuard, RoleGuard] },
  { path: 'admin/alunos/:id/ficha', component: StudentProfileComponent, canActivate: [AuthGuard, RoleGuard] },
  { path: 'professores/meus-alunos', component: StudentsListComponent, canActivate: [AuthGuard] },
  { path: 'professores/meus-alunos/novo', component: StudentFormComponent, canActivate: [AuthGuard] },
  { path: 'professores/meus-alunos/:id/editar', component: StudentFormComponent, canActivate: [AuthGuard] },
  { path: 'professores/meus-alunos/:id/ficha', component: StudentProfileComponent, canActivate: [AuthGuard] },
  { path: 'perfil', component: AdminProfileComponent, canActivate: [AuthGuard, RoleGuard] },
  { path: 'admin/consent-templates', component: ConsentTemplatesAdminComponent, canActivate: [AuthGuard, RoleGuard] },
  { path: 'admin/audit-logs', component: AuditLogComponent, canActivate: [AuthGuard, RoleGuard] },
  { path: 'admin/compliance-reports', component: ComplianceReportsSettingsComponent, canActivate: [AuthGuard, RoleGuard] },
  { path: 'training/session/:sessionId/attendance', component: TrainingAttendanceComponent, canActivate: [AuthGuard] },
  { path: 'training/session/:sessionId/techniques', component: TrainingAttendancePlaceholderComponent, canActivate: [AuthGuard] },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'health-screening/:studentId', component: HealthScreeningFormComponent, canActivate: [AuthGuard] },
  { path: 'consent/:token', component: ConsentWizardComponent },
  { path: '**', redirectTo: '/setup' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
