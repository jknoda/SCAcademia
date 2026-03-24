import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-health-screening-form',
  standalone: false,
  templateUrl: './health-screening-form.component.html',
  styleUrls: ['./health-screening-form.component.scss'],
})
export class HealthScreeningFormComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  isFetchingRecord = false;
  errorMessage = '';
  successMessage = '';
  studentId = '';
  isEditMode = false;
  private returnTo = '';

  readonly bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      bloodType: ['', Validators.required],
      weightKg: [null],
      heightCm: [null],
      hypertension: [false],
      diabetes: [false],
      cardiac: [false],
      labyrinthitis: [false],
      asthmaBronchitis: [false],
      epilepsySeizures: [false],
      stressDepression: [false],
      allergies: [''],
      medications: [''],
      existingConditions: [''],
      healthScreeningNotes: [''],
      emergencyContactName: ['', [Validators.required, Validators.minLength(2)]],
      emergencyContactPhone: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]],
    });

    this.studentId = this.route.snapshot.paramMap.get('studentId') || '';
    this.returnTo = this.route.snapshot.queryParamMap.get('returnTo') || '';
    if (this.studentId) {
      this.loadExistingRecord();
    }
  }

  private loadExistingRecord(): void {
    this.isFetchingRecord = true;
    this.api.getHealthScreening(this.studentId).subscribe({
      next: (response: any) => {
        this.isFetchingRecord = false;
        if (response?.healthRecord) {
          this.isEditMode = true;
          const r = response.healthRecord;
          this.form.patchValue({
            bloodType: r.bloodType || '',
            weightKg: r.weightKg,
            heightCm: r.heightCm,
            hypertension: r.hypertension || false,
            diabetes: r.diabetes || false,
            cardiac: r.cardiac || false,
            labyrinthitis: r.labyrinthitis || false,
            asthmaBronchitis: r.asthmaBronchitis || false,
            epilepsySeizures: r.epilepsySeizures || false,
            stressDepression: r.stressDepression || false,
            allergies: r.allergies || '',
            medications: r.medications || '',
            existingConditions: r.existingConditions || '',
            healthScreeningNotes: r.healthScreeningNotes || '',
            emergencyContactName: r.emergencyContactName || '',
            emergencyContactPhone: r.emergencyContactPhone || '',
          });
        }
      },
      error: (error: any) => {
        this.isFetchingRecord = false;
        // 404 = no record yet, that's fine — stays in create mode
        if (error.status !== 404) {
          this.errorMessage = error.error?.error || 'Erro ao carregar anamnese';
        }
      },
    });
  }

  getFieldError(field: string): string | null {
    const control = this.form.get(field);
    if (!control || !control.errors || !control.touched) return null;
    if (control.errors['required']) return 'Este campo é obrigatório';
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['pattern']) return 'Formato inválido (ex: 11987654321)';
    return null;
  }

  goBack(): void {
    this.navigateBack();
  }

  private navigateBack(): void {
    if (this.returnTo) {
      this.router.navigateByUrl(this.returnTo);
      return;
    }

    this.router.navigate(['/admin/dashboard']);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.studentId) {
      this.errorMessage = 'ID do aluno não encontrado. Verifique a URL.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload = { ...this.form.value };

    const request$ = this.isEditMode
      ? this.api.updateHealthScreening(this.studentId, payload)
      : this.api.createHealthScreening(this.studentId, payload);

    request$.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = response.message || '✓ Anamnese salva com sucesso';
        this.isEditMode = true;
        setTimeout(() => this.navigateBack(), 1500);
      },
      error: (error: any) => {
        this.isLoading = false;
        if (error.status === 403) {
          this.errorMessage = error.error?.error || 'Sem permissão para realizar esta ação';
        } else if (error.status === 409) {
          this.errorMessage = error.error?.error || 'Anamnese já existe para este aluno';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.error || 'Dados inválidos. Verifique os campos.';
        } else {
          this.errorMessage = error.error?.error || 'Erro ao salvar anamnese. Tente novamente.';
        }
      },
    });
  }
}
