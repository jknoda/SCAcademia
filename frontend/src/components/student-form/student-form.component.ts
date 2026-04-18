import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { compressImage } from '../../utils/image.utils';
import { AuthService } from '../../services/auth.service';
import { CreateStudentPayload, UpdateStudentPayload } from '../../types';

@Component({
  selector: 'app-student-form',
  standalone: false,
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.scss'],
})
export class StudentFormComponent implements OnInit {
  form: FormGroup;

  isEditMode = false;
  studentId = '';
  isLoading = false;
  isSaving = false;

  errorMessage = '';
  successMessage = '';
  warningMessage = '';
  cepLookupMessage = '';

  generatedPasswordModalOpen = false;
  generatedPassword = '';

  calculatedAge: number | null = null;
  isMinorCalculated = false;
  targetTurmaId = '';
  returnTo = '';

  readonly isAdmin: boolean;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    const user = this.auth.getCurrentUser();
    this.isAdmin = user?.role === 'Admin';

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
      photoUrl: [''],
      birthDate: ['', [Validators.required]],
      documentId: ['', [Validators.pattern(/^$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]],
      phone: [''],
      addressStreet: [''],
      addressNumber: [''],
      addressComplement: [''],
      addressNeighborhood: [''],
      addressPostalCode: ['', [Validators.pattern(/^$|^\d{5}-\d{3}$/)]],
      addressCity: [''],
      addressState: ['', [Validators.pattern(/^$|^[A-Za-z]{2}$/)]],
      dataEntrada: [''],
      turmaId: [''],
      responsavelEmail: ['', [Validators.email]],
    });

    this.form.get('birthDate')?.valueChanges.subscribe((value: string) => {
      this.recalculateMinority(value);
    });
  }

  ngOnInit(): void {
    this.targetTurmaId = (this.route.snapshot.queryParamMap.get('turmaId') || '').trim();
    this.returnTo = this.sanitizeReturnRoute(this.route.snapshot.queryParamMap.get('returnTo') || '');
    if (this.targetTurmaId) {
      this.form.get('turmaId')?.setValue(this.targetTurmaId);
    }

    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId) {
      this.isEditMode = true;
      this.studentId = routeId;
      this.form.get('email')?.disable();
      this.form.get('password')?.disable();
      this.form.get('turmaId')?.disable();
      this.loadStudent();
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.setSavingState(true);
    this.errorMessage = '';
    this.successMessage = '';
    this.warningMessage = '';

    if (this.isEditMode) {
      const payload = this.buildUpdatePayload();
      this.api.updateStudent(this.studentId, payload).pipe(
        timeout(10000),
        finalize(() => this.setSavingState(false))
      ).subscribe({
        next: (res) => {
          this.successMessage = res.message;
          this.refreshView();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || 'Erro ao atualizar aluno.';
          this.refreshView();
        },
      });
      return;
    }

    const payload = this.buildCreatePayload();
    this.api.createStudent(payload).pipe(
      timeout(10000),
      finalize(() => this.setSavingState(false))
    ).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.warningMessage = res.warning || '';
        if (res.temporaryPassword) {
          this.generatedPassword = res.temporaryPassword;
          this.generatedPasswordModalOpen = true;
        }
        this.refreshView();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Erro ao cadastrar aluno.';
        this.refreshView();
      },
    });
  }

  goToList(): void {
    if (this.returnTo) {
      this.router.navigateByUrl(this.returnTo);
      return;
    }

    if (this.isAdmin) {
      this.router.navigate(['/admin/alunos']);
      return;
    }

    this.router.navigate(['/professores/meus-alunos']);
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

  generateStrongPassword(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 12; i += 1) {
      const index = Math.floor(Math.random() * chars.length);
      result += chars[index];
    }

    result = `A1!${result.slice(3)}`;
    this.form.get('password')?.setValue(result);
    this.generatedPassword = result;
    this.generatedPasswordModalOpen = true;
  }

  closeGeneratedPasswordModal(goToList: boolean = false): void {
    this.generatedPasswordModalOpen = false;
    if (goToList) {
      this.goToList();
    }
  }

  copyGeneratedPassword(): void {
    if (!this.generatedPassword) return;
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(this.generatedPassword);
    }
  }

  getPhotoPreview(): string {
    return this.form.get('photoUrl')?.value || 'assets/default-user-photo.svg';
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Selecione um arquivo de imagem válido para a foto do aluno.';
      input.value = '';
      return;
    }

    compressImage(file).then(
      (dataUrl) => {
        this.form.get('photoUrl')?.setValue(dataUrl);
        this.errorMessage = '';
        this.successMessage = 'Foto carregada. Clique em salvar para confirmar.';
        this.refreshView();
      },
      () => {
        this.errorMessage = 'Não foi possível processar a imagem selecionada.';
        this.refreshView();
      }
    );
  }

  clearPhoto(): void {
    this.form.get('photoUrl')?.setValue('');
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

  private loadStudent(): void {
    this.setLoadingState(true);
    this.errorMessage = '';

    this.api.getStudentById(this.studentId).pipe(
      timeout(10000),
      finalize(() => this.setLoadingState(false))
    ).subscribe({
      next: (student) => {
        this.form.patchValue({
          email: student.email || '',
          fullName: student.fullName || '',
          photoUrl: student.photoUrl || '',
          birthDate: this.toDateInput(student.birthDate),
          documentId: student.documentId || '',
          phone: student.phone || '',
          addressStreet: student.addressStreet || '',
          addressNumber: student.addressNumber || '',
          addressComplement: student.addressComplement || '',
          addressNeighborhood: student.addressNeighborhood || '',
          addressPostalCode: student.addressPostalCode || '',
          addressCity: student.addressCity || '',
          addressState: (student.addressState || '').toUpperCase(),
          dataEntrada: this.toDateInput(student.dataEntrada),
        });

        this.recalculateMinority(this.toDateInput(student.birthDate));
        this.refreshView();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Erro ao carregar dados do aluno.';
        this.refreshView();
      },
    });
  }

  private recalculateMinority(birthDate: string): void {
    if (!birthDate) {
      this.calculatedAge = null;
      this.isMinorCalculated = false;
      return;
    }

    const date = new Date(birthDate);
    if (Number.isNaN(date.getTime())) {
      this.calculatedAge = null;
      this.isMinorCalculated = false;
      return;
    }

    const now = new Date();
    let age = now.getFullYear() - date.getFullYear();
    const monthDelta = now.getMonth() - date.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < date.getDate())) {
      age -= 1;
    }

    this.calculatedAge = age;
    this.isMinorCalculated = age < 18;
  }

  private buildCreatePayload(): CreateStudentPayload {
    const raw = this.form.getRawValue();
    return {
      email: raw.email,
      password: raw.password,
      fullName: raw.fullName,
      photoUrl: raw.photoUrl || '',
      birthDate: raw.birthDate,
      documentId: raw.documentId || '',
      phone: raw.phone || '',
      addressStreet: raw.addressStreet || '',
      addressNumber: raw.addressNumber || '',
      addressComplement: raw.addressComplement || '',
      addressNeighborhood: raw.addressNeighborhood || '',
      addressPostalCode: raw.addressPostalCode || '',
      addressCity: raw.addressCity || '',
      addressState: (raw.addressState || '').toUpperCase(),
      dataEntrada: raw.dataEntrada || '',
      turmaId: raw.turmaId || '',
      responsavelEmail: raw.responsavelEmail || '',
    };
  }

  private buildUpdatePayload(): UpdateStudentPayload {
    const raw = this.form.getRawValue();
    return {
      fullName: raw.fullName,
      photoUrl: raw.photoUrl || '',
      birthDate: raw.birthDate,
      documentId: raw.documentId || '',
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

  private sanitizeReturnRoute(value: string): string {
    const trimmed = value.trim();
    if (!trimmed.startsWith('/training/session/')) {
      return '';
    }

    if (!trimmed.endsWith('/attendance')) {
      return '';
    }

    return trimmed;
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
