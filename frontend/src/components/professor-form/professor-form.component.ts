import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CreateProfessorPayload, UpdateProfessorPayload } from '../../types';

@Component({
  selector: 'app-professor-form',
  standalone: false,
  templateUrl: './professor-form.component.html',
  styleUrls: ['./professor-form.component.scss'],
})
export class ProfessorFormComponent implements OnInit {
  form: FormGroup;
  resetPasswordForm: FormGroup;

  isEditMode = false;
  professorId = '';

  isLoading = false;
  isSaving = false;
  isResettingPassword = false;

  errorMessage = '';
  successMessage = '';
  resetPasswordMessage = '';

  generatedPasswordModalOpen = false;
  generatedPassword = '';

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/[A-Z]/),
          Validators.pattern(/[0-9]/),
          Validators.pattern(/[^A-Za-z0-9]/),
        ],
      ],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
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
      dataEntrada: [''],
    });

    this.resetPasswordForm = this.fb.group({
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
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId) {
      this.isEditMode = true;
      this.professorId = routeId;
      this.form.get('email')?.disable();
      this.form.get('password')?.disable();
      this.loadProfessor();
    }
  }

  private loadProfessor(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.getProfessorById(this.professorId).subscribe({
      next: (professor) => {
        this.isLoading = false;
        this.form.patchValue({
          email: professor.email || '',
          fullName: professor.fullName || '',
          documentId: professor.documentId || '',
          birthDate: this.toDateInput(professor.birthDate),
          phone: professor.phone || '',
          addressStreet: professor.addressStreet || '',
          addressNumber: professor.addressNumber || '',
          addressComplement: professor.addressComplement || '',
          addressNeighborhood: professor.addressNeighborhood || '',
          addressPostalCode: professor.addressPostalCode || '',
          addressCity: professor.addressCity || '',
          addressState: (professor.addressState || '').toUpperCase(),
          dataEntrada: this.toDateInput(professor.dataEntrada),
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.error || 'Erro ao carregar dados do professor.';
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditMode) {
      const payload: UpdateProfessorPayload = this.buildUpdatePayload();
      this.api.updateProfessor(this.professorId, payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.successMessage = res.message;
        },
        error: (error) => {
          this.isSaving = false;
          this.errorMessage = error?.error?.error || 'Erro ao atualizar professor.';
        },
      });
      return;
    }

    const payload: CreateProfessorPayload = this.buildCreatePayload();
    this.api.createProfessor(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.successMessage = res.message;
        if (res.temporaryPassword) {
          this.generatedPassword = res.temporaryPassword;
          this.generatedPasswordModalOpen = true;
        }
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error?.error?.error || 'Erro ao cadastrar professor.';
      },
    });
  }

  resetPassword(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    const formValue = this.resetPasswordForm.value;
    if (formValue.newPassword !== formValue.confirmPassword) {
      this.resetPasswordMessage = 'Confirmação de senha deve ser igual à nova senha';
      return;
    }

    this.isResettingPassword = true;
    this.resetPasswordMessage = '';

    this.api
      .resetProfessorPassword(this.professorId, {
        newPassword: formValue.newPassword,
        confirmPassword: formValue.confirmPassword,
      })
      .subscribe({
        next: (res) => {
          this.isResettingPassword = false;
          this.resetPasswordMessage = res.message;
          this.resetPasswordForm.reset();
        },
        error: (error) => {
          this.isResettingPassword = false;
          this.resetPasswordMessage = error?.error?.error || 'Erro ao redefinir senha.';
        },
      });
  }

  generateStrongPassword(targetControl: 'password' | 'newPassword' = 'password'): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 12; i += 1) {
      const index = Math.floor(Math.random() * chars.length);
      result += chars[index];
    }

    // Force policy requirements in deterministic positions.
    result = `A1!${result.slice(3)}`;

    if (targetControl === 'password') {
      this.form.get('password')?.setValue(result);
      this.generatedPassword = result;
      this.generatedPasswordModalOpen = true;
    } else {
      this.resetPasswordForm.get('newPassword')?.setValue(result);
      this.resetPasswordForm.get('confirmPassword')?.setValue(result);
    }
  }

  closeGeneratedPasswordModal(goToList: boolean = false): void {
    this.generatedPasswordModalOpen = false;
    if (goToList) {
      this.router.navigate(['/admin/professores']);
    }
  }

  copyGeneratedPassword(): void {
    if (!this.generatedPassword) return;

    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(this.generatedPassword);
    }
  }

  goToList(): void {
    this.router.navigate(['/admin/professores']);
  }

  onPostalCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = (input.value || '').replace(/\D/g, '').slice(0, 8);
    input.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    this.form.get('addressPostalCode')?.setValue(input.value, { emitEvent: false });
  }

  onAddressStateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = (input.value || '').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
    input.value = value;
    this.form.get('addressState')?.setValue(value, { emitEvent: false });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (!field || !field.touched || !field.errors) {
      return null;
    }

    if (field.errors['required']) return 'Campo obrigatório';
    if (field.errors['email']) return 'Email inválido';
    if (field.errors['minlength']) return 'Valor muito curto';
    if (field.errors['pattern']) {
      if (fieldName === 'documentId') return 'CPF invalido';
      if (fieldName === 'addressPostalCode') return 'CEP deve estar no formato 00000-000';
      if (fieldName === 'addressState') return 'UF deve conter 2 letras';
      if (fieldName === 'password') return 'Senha deve conter maiúscula, número e caractere especial';
      return 'Formato inválido';
    }

    return null;
  }

  private buildCreatePayload(): CreateProfessorPayload {
    const raw = this.form.getRawValue();
    return {
      email: raw.email,
      password: raw.password,
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
      dataEntrada: raw.dataEntrada || '',
    };
  }

  private buildUpdatePayload(): UpdateProfessorPayload {
    const raw = this.form.getRawValue();
    return {
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
      dataEntrada: raw.dataEntrada || '',
    };
  }

  private toDateInput(value: string | Date | null | undefined): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return '';

    return date.toISOString().slice(0, 10);
  }
}
