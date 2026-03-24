import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AcademyProfile, UpdateAcademyProfilePayload } from '../../types';

@Component({
  selector: 'app-academy-profile',
  standalone: false,
  templateUrl: './academy-profile.component.html',
  styleUrls: ['./academy-profile.component.scss'],
})
export class AcademyProfileComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  serverErrors: { [key: string]: string } = {};

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      documentId: ['', [Validators.required, Validators.pattern(/^(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})$/)]],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', [Validators.required, Validators.minLength(10)]],
      addressStreet: [''],
      addressNumber: [''],
      addressComplement: [''],
      addressNeighborhood: [''],
      addressPostalCode: ['', [Validators.pattern(/^\d{5}-?\d{3}$/)]],
      addressCity: [''],
      addressState: ['', [Validators.pattern(/^[A-Za-z]{2}$/)]],
      maxUsers: [{ value: '', disabled: true }],
      storageLimitGb: [{ value: '', disabled: true }],
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.getAdminAcademyProfile().subscribe({
      next: (profile: AcademyProfile) => {
        this.isLoading = false;
        this.form.patchValue({
          name: profile.name || '',
          description: profile.description || '',
          documentId: profile.documentId || '',
          contactEmail: profile.contactEmail || '',
          contactPhone: profile.contactPhone || '',
          addressStreet: profile.addressStreet || '',
          addressNumber: profile.addressNumber || '',
          addressComplement: profile.addressComplement || '',
          addressNeighborhood: profile.addressNeighborhood || '',
          addressPostalCode: profile.addressPostalCode || '',
          addressCity: profile.addressCity || '',
          addressState: (profile.addressState || '').toUpperCase(),
          maxUsers: profile.maxUsers ?? '',
          storageLimitGb: profile.storageLimitGb ?? '',
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.error || 'Erro ao carregar perfil da academia.';
      },
    });
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

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.serverErrors = {};

    const raw = this.form.getRawValue();
    const payload: UpdateAcademyProfilePayload = {
      name: raw.name,
      description: raw.description || '',
      documentId: raw.documentId,
      contactEmail: raw.contactEmail,
      contactPhone: raw.contactPhone,
      addressStreet: raw.addressStreet || '',
      addressNumber: raw.addressNumber || '',
      addressComplement: raw.addressComplement || '',
      addressNeighborhood: raw.addressNeighborhood || '',
      addressPostalCode: raw.addressPostalCode || '',
      addressCity: raw.addressCity || '',
      addressState: (raw.addressState || '').toUpperCase(),
    };

    this.api.updateAdminAcademyProfile(payload).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.successMessage = 'Dados da academia atualizados';
        this.form.patchValue({
          maxUsers: response.academy.maxUsers ?? '',
          storageLimitGb: response.academy.storageLimitGb ?? '',
        });
      },
      error: (error) => {
        this.isSaving = false;

        if (error?.error?.details && Array.isArray(error.error.details)) {
          for (const detail of error.error.details) {
            this.serverErrors[detail.field] = detail.message;
          }
        }

        this.errorMessage = error?.error?.error || 'Erro ao salvar dados da academia.';
      },
    });
  }

  getFieldError(fieldName: string): string | null {
    if (this.serverErrors[fieldName]) {
      return this.serverErrors[fieldName];
    }

    const field = this.form.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return null;
    }

    if (field.errors['required']) return 'Campo obrigatório';
    if (field.errors['email']) return 'Email inválido';
    if (field.errors['minlength']) return 'Valor muito curto';

    if (field.errors['pattern']) {
      if (fieldName === 'documentId') return 'CNPJ/CPF inválido';
      if (fieldName === 'addressPostalCode') return 'CEP deve estar no formato 00000-000';
      if (fieldName === 'addressState') return 'UF deve conter 2 letras';
      return 'Formato inválido';
    }

    return null;
  }
}
