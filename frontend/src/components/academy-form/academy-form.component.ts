import { ChangeDetectorRef, Component, EventEmitter, NgZone, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { compressImage } from '../../utils/image.utils';

@Component({
  selector: 'app-academy-form',
  standalone: false,
  templateUrl: './academy-form.component.html',
  styleUrls: ['./academy-form.component.scss'],
})
export class AcademyFormComponent {
  @Output() academyCreated = new EventEmitter<{ academyId: string; name: string; email: string }>();

  academyForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  serverErrors: { [key: string]: string } = {};

  constructor(private fb: FormBuilder, private api: ApiService, private ngZone: NgZone, private cdr: ChangeDetectorRef) {
    this.academyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      fantasyName: [''],
      location: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]],
      logoUrl: [''],
    });

    this.academyForm.get('name')?.valueChanges.subscribe((nameVal: string) => {
      if (!this.academyForm.get('fantasyName')?.value) {
        this.academyForm.get('fantasyName')?.setValue(nameVal, { emitEvent: false });
      }
    });
  }

  onSubmit(): void {
    if (this.academyForm.invalid) {
      return;
    }

    this.setLoadingState(true);
    this.errorMessage = '';
    this.serverErrors = {};

    this.api.createAcademy(this.academyForm.value).subscribe(
      (response: any) => {
        this.setLoadingState(false);
        this.academyCreated.emit({
          academyId: response.academyId,
          name: this.academyForm.get('name')?.value,
          email: this.academyForm.get('email')?.value,
        });
      },
      (error: any) => {
        this.setLoadingState(false);
        if (error.error?.details) {
          error.error.details.forEach((detail: any) => {
            this.serverErrors[detail.field] = detail.message;
          });
        }
        this.errorMessage = error.error?.error || 'Erro ao criar academia. Tente novamente.';
      }
    );
  }

  getFieldError(fieldName: string): string | null {
    const field = this.academyForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return null;
    }

    if (this.serverErrors[fieldName]) {
      return this.serverErrors[fieldName];
    }

    if (field.errors['required']) return 'Campo obrigatório';
    if (field.errors['minLength']) return 'Valor muito curto';
    if (field.errors['email']) return 'Email inválido';
    if (field.errors['pattern']) return 'Formato inválido';

    return null;
  }

  getLogoPreview(): string {
    return this.academyForm.get('logoUrl')?.value || 'assets/default-academy-logo.svg';
  }

  onLogoSelected(event: Event): void {
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
        this.academyForm.get('logoUrl')?.setValue(dataUrl);
        this.cdr.detectChanges();
      },
      () => {
        this.errorMessage = 'Não foi possível processar a imagem selecionada.';
        this.cdr.detectChanges();
      }
    );
  }

  clearLogo(): void {
    this.academyForm.get('logoUrl')?.setValue('');
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }
}
