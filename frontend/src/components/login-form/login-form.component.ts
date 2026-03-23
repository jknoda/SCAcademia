import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login-form',
  standalone: false,
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
})
export class LoginFormComponent implements OnInit {
  @Output() loginSuccess = new EventEmitter<void>();

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showSuccess = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private api: ApiService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    // If no academy exists yet, go to setup
    this.api.checkSetupNeeded().subscribe(
      (response: any) => {
        if (response.needsSetup) {
          this.router.navigate(['/setup']);
        }
      },
      () => { /* ignore error, let user try to login */ }
    );
  }

  goToRegister(): void {
    const academyId = localStorage.getItem('academyId');
    if (academyId) {
      this.router.navigate(['/register'], { queryParams: { academyId } });
      return;
    }
    this.router.navigate(['/register']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.auth.login(email, password).subscribe(
      () => {
        this.isLoading = false;
        this.showSuccess = true;
        setTimeout(() => {
          if (this.loginSuccess.observers.length > 0) {
            this.loginSuccess.emit();
          } else {
            this.router.navigate(['/admin/dashboard']);
          }
        }, 1500);
      },
      (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Email ou senha incorretos';
      }
    );
  }

  getFieldError(fieldName: string): string | null {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return null;
    }

    if (field.errors['required']) return 'Campo obrigatório';
    if (field.errors['email']) return 'Email inválido';

    return null;
  }
}
