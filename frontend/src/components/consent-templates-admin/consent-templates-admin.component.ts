import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import {
  AdminConsentTemplate,
  AdminConsentTemplatesResponse,
  PublishConsentTemplatesPayload,
  ReconsentAffectedStudent,
} from '../../types';

@Component({
  selector: 'app-consent-templates-admin',
  standalone: false,
  templateUrl: './consent-templates-admin.component.html',
  styleUrls: ['./consent-templates-admin.component.scss'],
})
export class ConsentTemplatesAdminComponent implements OnInit {
  isLoading = true;
  isPublishing = false;
  errorMessage = '';
  successMessage = '';
  academyName = '';
  currentVersion = '1.0';
  bumpType: 'minor' | 'major' = 'minor';
  templates: AdminConsentTemplate[] = [];
  affectedStudents: ReconsentAffectedStudent[] = [];
  form: PublishConsentTemplatesPayload = {
    healthContent: '',
    ethicsContent: '',
    privacyContent: '',
    bumpType: 'minor',
  };
  constructor(
    private api: ApiService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.setLoadingState(true);
    this.errorMessage = '';

    this.api
      .getAdminConsentTemplates()
      .pipe(
        timeout(15000),
        finalize(() => this.setLoadingState(false))
      )
      .subscribe({
        next: (response: AdminConsentTemplatesResponse) => {
          const templates = Array.isArray(response?.templates) ? response.templates : [];
          this.academyName = response?.academyName || '';
          this.templates = templates;
          this.affectedStudents = [];
          this.currentVersion = templates[0]?.version || '1.0';

          const health = templates.find((template) => template.consentType === 'health');
          const ethics = templates.find((template) => template.consentType === 'ethics');
          const privacy = templates.find((template) => template.consentType === 'privacy');

          this.form = {
            healthContent: health?.content || '',
            ethicsContent: ethics?.content || '',
            privacyContent: privacy?.content || '',
            bumpType: this.bumpType,
          };
        },
        error: (error: any) => {
          if (error?.name === 'TimeoutError') {
            this.errorMessage = 'Tempo esgotado ao carregar termos. Verifique a conexão com o backend e tente novamente.';
            return;
          }
          this.errorMessage = error?.error?.error || 'Erro ao carregar termos de consentimento';
        }
      });
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }

  getNextVersionLabel(): string {
    const current = Number(this.currentVersion || '1.0');
    if (!current) return '1.0';
    return this.bumpType === 'major'
      ? `${Math.floor(current) + 1}.0`
      : (current + 0.1).toFixed(1);
  }

  publish(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.form.healthContent.trim() || !this.form.ethicsContent.trim() || !this.form.privacyContent.trim()) {
      this.errorMessage = 'Preencha os três textos antes de publicar.';
      return;
    }

    this.isPublishing = true;
    this.api
      .publishAdminConsentTemplates({
        ...this.form,
        bumpType: this.bumpType,
      })
      .subscribe({
        next: (response) => {
          this.isPublishing = false;
          this.successMessage = response.message;
          this.templates = response.templates;
          this.affectedStudents = response.affectedStudents;
          this.currentVersion = response.version;
          this.form = {
            healthContent: response.templates.find((template) => template.consentType === 'health')?.content || '',
            ethicsContent: response.templates.find((template) => template.consentType === 'ethics')?.content || '',
            privacyContent: response.templates.find((template) => template.consentType === 'privacy')?.content || '',
            bumpType: this.bumpType,
          };
        },
        error: (error: any) => {
          this.isPublishing = false;
          this.errorMessage = error.error?.error || 'Erro ao publicar nova versão';
        }
      });
  }

  backToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  copyConsentLink(link: string): void {
    navigator.clipboard.writeText(link);
  }
}