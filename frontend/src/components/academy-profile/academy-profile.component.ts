import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { compressImage } from '../../utils/image.utils';
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
  cepLookupMessage = '';

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      fantasyName: [''],
      logoUrl: [''],
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
    this.setLoadingState(true);
    this.errorMessage = '';

    this.api.getAdminAcademyProfile().pipe(
      timeout(10000),
      finalize(() => this.setLoadingState(false))
    ).subscribe({
      next: (profile: AcademyProfile) => {
        this.form.patchValue({
          name: profile.name || '',
          fantasyName: profile.fantasyName || '',
          logoUrl: profile.logoUrl || '',
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
        this.refreshView();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Erro ao carregar perfil da academia.';
        this.refreshView();
      },
    });
  }

  onPostalCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = (input.value || '').replace(/\D/g, '').slice(0, 8);
    input.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    this.form.get('addressPostalCode')?.setValue(input.value, { emitEvent: false });
    this.cepLookupMessage = '';
  }

  onPostalCodeBlur(): void {
    this.cepLookupMessage = '';
    const cepValue = String(this.form.get('addressPostalCode')?.value || '');
    const sanitizedCep = cepValue.replace(/\D/g, '');
    if (sanitizedCep.length !== 8) {
      return;
    }

    this.api.lookupAddressByCep(sanitizedCep).subscribe({
      next: (result) => {
        const notFound = result?.erro === true || result?.erro === 'true';
        if (!result || notFound) {
          this.cepLookupMessage = 'CEP não encontrado';
          return;
        }

        this.patchAddressField('addressStreet', result.logradouro || '');
        this.patchAddressField('addressNeighborhood', result.bairro || '');
        this.patchAddressField('addressCity', result.localidade || '');
        this.patchAddressField('addressState', (result.uf || '').toUpperCase());
      },
      error: () => {
        // If ViaCEP fails, keep the form unchanged.
      },
    });
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

    this.setSavingState(true);
    this.errorMessage = '';
    this.successMessage = '';
    this.serverErrors = {};

    const raw = this.form.getRawValue();
    const payload: UpdateAcademyProfilePayload = {
      name: raw.name,
      fantasyName: raw.fantasyName || '',
      logoUrl: raw.logoUrl || '',
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

    this.api.updateAdminAcademyProfile(payload).pipe(
      timeout(10000),
      finalize(() => this.setSavingState(false))
    ).subscribe({
      next: (response) => {
        this.successMessage = 'Dados da academia atualizados';
        this.form.patchValue({
          maxUsers: response.academy.maxUsers ?? '',
          storageLimitGb: response.academy.storageLimitGb ?? '',
        });
        this.refreshView();
      },
      error: (error) => {
        if (error?.error?.details && Array.isArray(error.error.details)) {
          for (const detail of error.error.details) {
            this.serverErrors[detail.field] = detail.message;
          }
        }

        this.errorMessage = error?.error?.error || 'Erro ao salvar dados da academia.';
        this.refreshView();
      },
    });
  }

  backToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  goToEpic10(): void {
    this.router.navigate(['/admin/alunos'], {
      queryParams: { highlight: 'athlete-progress' },
    });
  }

  getAcademyLogoPreview(): string {
    return this.form.get('logoUrl')?.value || 'assets/default-academy-logo.svg';
  }

  onLogoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Selecione um arquivo de imagem válido para o logotipo.';
      input.value = '';
      return;
    }

    compressImage(file).then(
      (dataUrl) => {
        this.form.get('logoUrl')?.setValue(dataUrl);
        this.successMessage = 'Logotipo carregado. Clique em salvar para confirmar.';
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      () => {
        this.errorMessage = 'Não foi possível processar a imagem selecionada.';
        this.cdr.detectChanges();
      }
    );
  }

  clearLogo(): void {
    this.form.get('logoUrl')?.setValue('');
    this.successMessage = '';
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

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }

  private setSavingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isSaving = value;
      this.cdr.detectChanges();
    });
  }

  private refreshView(): void {
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
  }

  private patchAddressField(controlName: string, nextValue: string): void {
    const control = this.form.get(controlName);
    if (!control) {
      return;
    }

    control.setValue(nextValue, { emitEvent: false });
  }
}
