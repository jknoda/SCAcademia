import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { AdminProfileUpdatePayload, User } from '../../types';

@Component({
  selector: 'app-admin-profile',
  standalone: false,
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.scss'],
})
export class AdminProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;

  currentUser: User | null = null;
  isLoading = false;
  isSaving = false;
  isChangingPassword = false;

  successMessage = '';
  errorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }],
      documentId: ['', [Validators.pattern(/^$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]],
      birthDate: [''],
      phone: [''],
      addressStreet: [''],
      addressNumber: [''],
      addressComplement: [''],
      addressNeighborhood: [''],
      addressPostalCode: ['', [Validators.pattern(/^$|^\d{5}-\d{3}$/)]],
      addressCity: [''],
      addressState: ['', [Validators.pattern(/^$|^[A-Za-z]{2}$/)]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/[A-Z]/),
          Validators.pattern(/[0-9]/),
          Validators.pattern(/[^A-Za-z0-9]/),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    if (!this.currentUser || this.currentUser.role !== 'Admin') {
      this.router.navigate(['/login']);
      return;
    }

    this.loadProfile();
  }

  loadProfile(): void {
    if (!this.currentUser) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.api.getUserProfile(this.currentUser.id).subscribe({
      next: (profile) => {
        this.isLoading = false;
        this.profileForm.patchValue({
          fullName: profile.fullName || '',
          email: profile.email || '',
          documentId: profile.documentId || '',
          birthDate: this.toDateInput(profile.birthDate),
          phone: profile.phone || '',
          addressStreet: profile.addressStreet || '',
          addressNumber: profile.addressNumber || '',
          addressComplement: profile.addressComplement || '',
          addressNeighborhood: profile.addressNeighborhood || '',
          addressPostalCode: profile.addressPostalCode || '',
          addressCity: profile.addressCity || '',
          addressState: (profile.addressState || '').toUpperCase(),
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.error || 'Erro ao carregar perfil do administrador.';
      },
    });
  }

  saveProfile(): void {
    if (!this.currentUser) return;
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const raw = this.profileForm.getRawValue();
    const payload: AdminProfileUpdatePayload = {
      fullName: raw.fullName,
      documentId: raw.documentId || '',
      birthDate: raw.birthDate || '',
      phone: raw.phone || '',
      addressStreet: raw.addressStreet || '',
      addressNumber: raw.addressNumber || '',
      addressComplement: raw.addressComplement || '',
      addressNeighborhood: raw.addressNeighborhood || '',
      addressPostalCode: raw.addressPostalCode || '',
      addressCity: raw.addressCity || '',
      addressState: (raw.addressState || '').toUpperCase(),
    };

    this.api.updateUserProfile(this.currentUser.id, payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.successMessage = 'Perfil atualizado';
        this.auth.updateCurrentUserProfile({ fullName: res.user.fullName });
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error?.error?.error || 'Erro ao atualizar perfil.';
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const value = this.passwordForm.value;
    if (value.newPassword !== value.confirmPassword) {
      this.passwordErrorMessage = 'Confirmação de senha deve ser igual à nova senha';
      this.passwordSuccessMessage = '';
      return;
    }

    this.isChangingPassword = true;
    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';

    this.api
      .changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
        confirmPassword: value.confirmPassword,
      })
      .subscribe({
        next: () => {
          this.isChangingPassword = false;
          this.passwordSuccessMessage = 'Senha alterada com sucesso';
          this.passwordForm.reset();
        },
        error: (error) => {
          this.isChangingPassword = false;
          this.passwordErrorMessage = error?.error?.error || 'Erro ao alterar senha.';
        },
      });
  }

  onPostalCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = (input.value || '').replace(/\D/g, '').slice(0, 8);
    input.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    this.profileForm.get('addressPostalCode')?.setValue(input.value, { emitEvent: false });
  }

  onAddressStateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = (input.value || '').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
    input.value = value;
    this.profileForm.get('addressState')?.setValue(value, { emitEvent: false });
  }

  backToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  getProfileFieldError(fieldName: string): string | null {
    const field = this.profileForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return null;
    }

    if (field.errors['required']) return 'Campo obrigatório';
    if (field.errors['minlength']) return 'Valor muito curto';
    if (field.errors['pattern']) {
      if (fieldName === 'documentId') return 'CPF deve estar no formato 000.000.000-00';
      if (fieldName === 'addressPostalCode') return 'CEP deve estar no formato 00000-000';
      if (fieldName === 'addressState') return 'UF deve conter 2 letras';
      return 'Formato inválido';
    }

    return null;
  }

  getPasswordFieldError(fieldName: string): string | null {
    const field = this.passwordForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return null;
    }

    if (field.errors['required']) return 'Campo obrigatório';
    if (field.errors['minlength']) return 'Senha deve ter ao menos 8 caracteres';
    if (field.errors['pattern']) return 'Senha deve conter maiúscula, número e caractere especial';

    return null;
  }

  private toDateInput(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().slice(0, 10);
  }
}
