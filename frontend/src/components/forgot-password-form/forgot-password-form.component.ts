import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password-form',
  standalone: false,
  templateUrl: './forgot-password-form.component.html',
  styleUrls: ['./forgot-password-form.component.scss'],
})
export class ForgotPasswordFormComponent {
  forgotForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.setLoadingState(true);
    this.errorMessage = '';
    this.successMessage = '';

    const { email } = this.forgotForm.value;
    this.auth.forgotPassword(email).subscribe({
      next: (response) => {
        this.setLoadingState(false);
        this.successMessage = response.message;
      },
      error: (error: any) => {
        this.setLoadingState(false);
        this.errorMessage = error.error?.error || 'Erro ao solicitar recuperação de senha';
      },
    });
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.forgotForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return null;
    }

    if (field.errors['required']) return 'Campo obrigatório';
    if (field.errors['email']) return 'Email inválido';

    return null;
  }
}
