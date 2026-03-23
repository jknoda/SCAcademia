import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
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
  suggestions: string[] = [];
  showPassword = false;
  today = new Date().toISOString().split('T')[0];
  academyId = '';

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
    private auth: AuthService,
    private router: Router,
    private passwordValidator: PasswordValidatorService
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

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (!this.academyId) {
      this.errorMessage = 'Academia não encontrada. Verifique a URL ou entre em contato com o administrador.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.suggestions = [];

    const { fullName, email, password, role, birthDate, responsavelEmail } = this.registerForm.value;

    this.api
      .registerUser({
        email,
        password,
        fullName,
        role,
        academyId: this.academyId,
        birthDate: birthDate || undefined,
        responsavelEmail: responsavelEmail || undefined,
      })
      .subscribe(
        (response: any) => {
          this.isLoading = false;
          this.successMessage = response.message || '✓ Registro realizado com sucesso';

          if (response.requiresConsent) {
            this.requiresConsent = true;
            return;
          }

          if (response.accessToken) {
            this.api.setAccessToken(response.accessToken);
            setTimeout(() => this.router.navigate(['/admin/dashboard']), 1500);
          } else {
            setTimeout(() => this.router.navigate(['/login']), 1500);
          }
        },
        (error: any) => {
          this.isLoading = false;
          if (error.status === 409) {
            this.errorMessage = error.error?.error || 'Email já registrado';
            this.suggestions = error.error?.suggestions || [];
          } else if (error.status === 400) {
            this.errorMessage = error.error?.error || 'Dados inválidos';
          } else {
            this.errorMessage = error.error?.error || 'Erro ao registrar. Dados não foram salvos. Tente novamente';
          }
        }
      );
  }
}
