import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { EMPTY } from 'rxjs';
import { catchError, finalize, switchMap, timeout } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { PasswordValidatorService } from '../../services/password-validator.service';

@Component({
  selector: 'app-register-form',
  standalone: false,
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.scss'],
})
export class RegisterFormComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  requiresConsent = false;
  consentLink = '';
  linkCopied = false;
  suggestions: string[] = [];
  showPassword = false;
  today = new Date().toISOString().split('T')[0];
  academyId = '';
  private loadingWatchdog: ReturnType<typeof setTimeout> | null = null;

  passwordStrength = {
    score: 0,
    requirements: {
      minLength: false,
      hasUppercase: false,
      hasNumber: false,
      hasSpecialChar: false,
    },
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
    private router: Router,
    private passwordValidator: PasswordValidatorService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        fullName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        role: ['Professor', Validators.required],
        birthDate: [''],
        responsavelEmail: [''],
        password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator.bind(this)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordsMatchValidator }
    );

    const academyIdFromQuery = this.route.snapshot.queryParamMap.get('academyId');
    const academyIdFromStorage = localStorage.getItem('academyId') || '';
    this.academyId = academyIdFromQuery || academyIdFromStorage;

    if (academyIdFromQuery) {
      localStorage.setItem('academyId', academyIdFromQuery);
    }

    if (!this.academyId) {
      this.api.checkSetupNeeded().subscribe((response: any) => {
        if (response.academyId) {
          this.academyId = response.academyId;
          localStorage.setItem('academyId', response.academyId);
        }
      });
    }

    this.registerForm.get('password')?.valueChanges.subscribe((value: string) => {
      if (value) {
        this.passwordStrength = this.passwordValidator.validatePasswordStrength(value);
      }
    });

    this.registerForm.get('birthDate')?.valueChanges.subscribe(() => {
      const responsavelControl = this.registerForm.get('responsavelEmail');
      if (this.isMinor()) {
        responsavelControl?.setValidators([Validators.required, Validators.email]);
      } else {
        responsavelControl?.clearValidators();
      }
      responsavelControl?.updateValueAndValidity();
    });
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string;
    if (!value) return null;
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);
    if (!hasUpper || !hasNumber || !hasSpecial) {
      return { weakPassword: true };
    }
    return null;
  }

  passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
  }

  isMinor(): boolean {
    const birthDate = this.registerForm.get('birthDate')?.value;
    const role = this.registerForm.get('role')?.value;
    if (!birthDate || role !== 'Aluno') return false;
    const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age < 18;
  }

  getStrengthClass(): string {
    const score = this.passwordStrength.score;
    if (score < 30) return 'weak';
    if (score < 60) return 'fair';
    if (score < 85) return 'good';
    return 'strong';
  }

  getStrengthLabel(): string {
    const cls = this.getStrengthClass();
    const labels: Record<string, string> = { weak: 'Fraca', fair: 'Regular', good: 'Boa', strong: 'Forte' };
    return labels[cls];
  }

  getFieldError(field: string): string | null {
    const control = this.registerForm.get(field);
    if (!control || !control.errors || !control.touched) return null;
    if (control.errors['required']) return 'Este campo é obrigatório';
    if (control.errors['email']) return 'Email inválido';
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['weakPassword']) return 'Senha precisa de maiúscula, número e caractere especial';
    return null;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  copyLink(): void {
    if (this.consentLink) {
      navigator.clipboard.writeText(this.consentLink);
      this.linkCopied = true;
      setTimeout(() => (this.linkCopied = false), 2000);
    }
  }

  private handleRegisterSuccess(response: any): void {
    this.successMessage = response.message || '✓ Registro realizado com sucesso';

    if (response.requiresConsent) {
      this.requiresConsent = true;
      this.consentLink = response.consentLink || '';

      if (this.consentLink) {
        const popup = window.open(this.consentLink, '_blank', 'noopener,noreferrer');
        if (!popup) {
          sessionStorage.setItem('pendingConsentLink', this.consentLink);
        } else {
          sessionStorage.removeItem('pendingConsentLink');
        }
      }

      setTimeout(() => this.router.navigate(['/login']), 300);
      return;
    }

    if (response.accessToken) {
      this.api.setAccessToken(response.accessToken);
      const destination = response.user?.role === 'Admin' ? '/admin/dashboard' : '/home';
      setTimeout(() => this.router.navigate([destination]), 1500);
      return;
    }

    setTimeout(() => this.router.navigate(['/login']), 1500);
  }

  private handleRegisterError(error: any): void {
    const apiError = error?.error;
    const normalizedMessage =
      (typeof apiError === 'string' ? apiError : apiError?.error) ||
      error?.message ||
      'Erro ao registrar. Dados não foram salvos. Tente novamente';

    this.suggestions = Array.isArray(apiError?.suggestions) ? apiError.suggestions : [];

    if (error.status === 0) {
      this.errorMessage = 'Servidor indisponível. Verifique se o backend está rodando.';
    } else if (error.status === 409) {
      this.errorMessage = normalizedMessage || 'Email já registrado';
    } else if (error.status === 400) {
      this.errorMessage = normalizedMessage || 'Dados inválidos';
    } else if (error.status === 404) {
      this.errorMessage = normalizedMessage || 'Academia não encontrada. Verifique se a URL está correta.';
    } else {
      this.errorMessage = normalizedMessage;
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.setLoadingState(true);
    this.startLoadingWatchdog();
    this.errorMessage = '';
    this.suggestions = [];

    this.api
      .checkSetupNeeded()
      .pipe(
        timeout(10000),
        switchMap((setupResponse: any) => {
          if (setupResponse?.needsSetup || !setupResponse?.academyId) {
            this.errorMessage = 'Academia não encontrada. Execute o setup inicial da academia.';
            return EMPTY;
          }

          this.academyId = setupResponse.academyId;
          localStorage.setItem('academyId', setupResponse.academyId);

          const { fullName, email, password, role, birthDate, responsavelEmail } = this.registerForm.value;
          const payload = {
            email,
            password,
            fullName,
            role,
            academyId: this.academyId,
            birthDate: birthDate || undefined,
            responsavelEmail: responsavelEmail || undefined,
          };

          return this.api.registerUser(payload).pipe(timeout(15000));
        }),
        catchError((error: any) => {
          if (error?.name === 'TimeoutError') {
            this.errorMessage = 'A requisição demorou demais. Verifique a conexão e tente novamente.';
            return EMPTY;
          }

          const requestUrl = String(error?.url || '');
          if (requestUrl.includes('/auth/setup/init')) {
            this.errorMessage = 'Não foi possível validar a academia. Tente novamente.';
            return EMPTY;
          }

          this.handleRegisterError(error);
          return EMPTY;
        }),
        finalize(() => {
          this.clearLoadingWatchdog();
          this.setLoadingState(false);
        })
      )
      .subscribe((response: any) => {
        if (response) {
          this.handleRegisterSuccess(response);
        }
      });
  }

  private startLoadingWatchdog(): void {
    this.clearLoadingWatchdog();
    this.loadingWatchdog = setTimeout(() => {
      if (!this.isLoading) {
        return;
      }

      this.setLoadingState(false);
      if (!this.errorMessage) {
        this.errorMessage = 'A operação demorou mais do que o esperado. Tente novamente.';
      }
    }, 25000);
  }

  private clearLoadingWatchdog(): void {
    if (this.loadingWatchdog) {
      clearTimeout(this.loadingWatchdog);
      this.loadingWatchdog = null;
    }
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }
}
