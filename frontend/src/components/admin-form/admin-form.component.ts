import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { PasswordValidatorService } from '../../services/password-validator.service';

@Component({
  selector: 'app-admin-form',
  standalone: false,
  templateUrl: './admin-form.component.html',
  styleUrls: ['./admin-form.component.scss'],
})
export class AdminFormComponent {
  @Input() academyId: string = '';
  @Output() adminCreated = new EventEmitter<{ fullName: string; email: string }>();

  adminForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  passwordStrength: any = null;
  serverErrors: { [key: string]: string } = {};

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private passwordValidator: PasswordValidatorService
  ) {
    this.adminForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  onPasswordChange(): void {
    const password = this.adminForm.get('password')?.value;
    if (password) {
      this.passwordStrength = this.passwordValidator.validatePasswordStrength(password);
    }
  }

  isPasswordValid(): boolean {
    return this.passwordValidator.isValidPassword(this.adminForm.get('password')?.value || '');
  }

  getPasswordStrengthText(): string {
    if (!this.passwordStrength) return '';
    if (this.passwordStrength.score < 50) return 'Fraca';
    if (this.passwordStrength.score < 75) return 'Média';
    return 'Forte';
  }

  getPasswordStrengthClass(): string {
    if (!this.passwordStrength) return '';
    if (this.passwordStrength.score < 50) return 'weak';
    if (this.passwordStrength.score < 75) return 'medium';
    return 'strong';
  }

  onSubmit(): void {
    if (this.adminForm.invalid || !this.isPasswordValid()) {
      return;
    }

    const password = this.adminForm.get('password')?.value;
    const confirmPassword = this.adminForm.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      this.errorMessage = 'As senhas não conferem';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.serverErrors = {};

    const payload = {
      fullName: this.adminForm.get('fullName')?.value,
      email: this.adminForm.get('email')?.value,
      password: password,
    };

    this.api.initAdmin(this.academyId, payload).subscribe(
      (response: any) => {
        this.isLoading = false;
        this.adminCreated.emit({
          fullName: this.adminForm.get('fullName')?.value,
          email: this.adminForm.get('email')?.value,
        });
      },
      (error: any) => {
        this.isLoading = false;
        if (error.error?.details) {
          error.error.details.forEach((detail: any) => {
            this.serverErrors[detail.field] = detail.message;
          });
        }
        this.errorMessage = error.error?.error || 'Erro ao registrar admin. Tente novamente.';
      }
    );
  }

  getFieldError(fieldName: string): string | null {
    const field = this.adminForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return null;
    }

    if (this.serverErrors[fieldName]) {
      return this.serverErrors[fieldName];
    }

    if (field.errors['required']) return 'Campo obrigatório';
    if (field.errors['minLength']) return fieldName === 'fullName' ? 'Nome muito curto' : 'Senha muito curta';
    if (field.errors['email']) return 'Email inválido';

    return null;
  }
}
