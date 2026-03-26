import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app.routing.module';
import { AppComponent } from './app.component';
import { SetupComponent } from './components/setup/setup.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AcademyFormComponent } from './components/academy-form/academy-form.component';
import { AdminFormComponent } from './components/admin-form/admin-form.component';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { RegisterFormComponent } from './components/register-form/register-form.component';
import { ForgotPasswordFormComponent } from './components/forgot-password-form/forgot-password-form.component';
import { ResetPasswordFormComponent } from './components/reset-password-form/reset-password-form.component';
import { HealthScreeningFormComponent } from './components/health-screening-form/health-screening-form.component';
import { HomeComponent } from './components/home/home.component';
import { ConsentWizardComponent } from './components/consent-wizard/consent-wizard.component';
import { ConsentTemplatesAdminComponent } from './components/consent-templates-admin/consent-templates-admin.component';
import { AuditLogComponent } from './components/audit-log/audit-log.component';
import { ComplianceReportsSettingsComponent } from './components/compliance-reports-settings/compliance-reports-settings.component';
import { TrainingEntryPointComponent } from './components/training-entry-point/training-entry-point.component';
import { TrainingAttendancePlaceholderComponent } from './components/training-attendance-placeholder/training-attendance-placeholder.component';
import { TrainingAttendanceComponent } from './components/training-attendance/training-attendance.component';
import { TrainingTechniquesComponent } from './components/training-techniques/training-techniques.component';
import { TrainingNotesComponent } from './components/training-notes/training-notes.component';
import { TrainingReviewPlaceholderComponent } from './components/training-review-placeholder/training-review-placeholder.component';
import { TrainingReviewComponent } from './components/training-review/training-review.component';
import { TrainingSuccessComponent } from './components/training-success/training-success.component';
import { TrainingHistoryComponent } from './components/training-history/training-history.component';
import { AcademyProfileComponent } from './components/academy-profile/academy-profile.component';
import { AdminProfileComponent } from './components/admin-profile/admin-profile.component';
import { ProfessorsListComponent } from './components/professors-list/professors-list.component';
import { ProfessorFormComponent } from './components/professor-form/professor-form.component';
import { ProfessorTurmasComponent } from './components/professor-turmas/professor-turmas.component';
import { ProfessorTurmaCreateComponent } from './components/professor-turma-create/professor-turma-create.component';
import { ProfessorTechniquesComponent } from './components/professor-techniques/professor-techniques.component';
import { StudentsListComponent } from './components/students-list/students-list.component';
import { StudentFormComponent } from './components/student-form/student-form.component';
import { StudentProfileComponent } from './components/student-profile/student-profile.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { AuthInterceptor } from './services/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    SetupComponent,
    AdminDashboardComponent,
    AcademyFormComponent,
    AdminFormComponent,
    LoginFormComponent,
    RegisterFormComponent,
    ForgotPasswordFormComponent,
    ResetPasswordFormComponent,
    HealthScreeningFormComponent,
    HomeComponent,
    ConsentWizardComponent,
    ConsentTemplatesAdminComponent,
    AuditLogComponent,
    ComplianceReportsSettingsComponent,
    TrainingEntryPointComponent,
    TrainingAttendancePlaceholderComponent,
    TrainingAttendanceComponent,
    TrainingTechniquesComponent,
    TrainingNotesComponent,
    TrainingReviewPlaceholderComponent,
    TrainingReviewComponent,
    TrainingSuccessComponent,
    TrainingHistoryComponent,
    AcademyProfileComponent,
    AdminProfileComponent,
    ProfessorsListComponent,
    ProfessorFormComponent,
    ProfessorTurmasComponent,
    ProfessorTurmaCreateComponent,
    ProfessorTechniquesComponent,
    StudentsListComponent,
    StudentFormComponent,
    StudentProfileComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    AppRoutingModule,
  ],
  providers: [
    AuthGuard,
    RoleGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
