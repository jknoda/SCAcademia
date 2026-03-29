import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { compressImage } from '../../utils/image.utils';
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
    private passwordValidator: PasswordValidatorService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.adminForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      photoUrl: [''],
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

    this.setLoadingState(true);
    this.errorMessage = '';
    this.serverErrors = {};

    const payload = {
      fullName: this.adminForm.get('fullName')?.value,
      email: this.adminForm.get('email')?.value,
      photoUrl: this.adminForm.get('photoUrl')?.value || '',
      password: password,
    };

    this.api
      .initAdmin(this.academyId, payload)
      .pipe(finalize(() => this.setLoadingState(false)))
      .subscribe(
        (_response: any) => {
          this.adminCreated.emit({
            fullName: this.adminForm.get('fullName')?.value,
            email: this.adminForm.get('email')?.value,
          });
        },
        (error: any) => {
          if (error.error?.details) {
            error.error.details.forEach((detail: any) => {
              this.serverErrors[detail.field] = detail.message;
            });
          }
          this.errorMessage = error.error?.error || 'Erro ao registrar admin. Tente novamente.';
        }
      );
  }

  getPhotoPreview(): string {
    return this.adminForm.get('photoUrl')?.value || 'assets/default-user-photo.svg';
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Selecione um arquivo de imagem válido para a foto do administrador.';
      input.value = '';
      return;
    }

    compressImage(file).then(
      (dataUrl) => {
        this.adminForm.get('photoUrl')?.setValue(dataUrl);
      },
      () => {
        this.errorMessage = 'Não foi possível processar a imagem selecionada.';
      }
    );
  }

  clearPhoto(): void {
    this.adminForm.get('photoUrl')?.setValue('');
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
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
