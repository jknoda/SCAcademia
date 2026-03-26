import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Technique, User } from '../../types';

@Component({
  selector: 'app-professor-techniques',
  standalone: false,
  templateUrl: './professor-techniques.component.html',
  styleUrls: ['./professor-techniques.component.scss'],
})
export class ProfessorTechniquesComponent implements OnInit {
  currentUser: User | null = null;
  academyId = '';

  isLoading = false;
  isSaving = false;
  deletingTechniqueIds = new Set<string>();
  errorMessage = '';
  successMessage = '';

  newTechniqueName = '';
  newTechniqueDescription = '';
  newTechniqueCategory: 'Básica' | 'Avançada' = 'Básica';

  basicTechniques: Technique[] = [];
  advancedTechniques: Technique[] = [];

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.academyId = this.currentUser?.academy?.id || '';

    if (!this.currentUser || this.currentUser.role !== 'Professor') {
      this.router.navigate(['/home']);
      return;
    }

    if (!this.academyId) {
      this.errorMessage = 'Academia não identificada para carregar técnicas.';
      return;
    }

    this.loadTechniques();
  }

  loadTechniques(): void {
    if (!this.academyId) {
      return;
    }

    this.setLoadingState(true);
    this.errorMessage = '';
    this.successMessage = '';

    this.api.getAcademyTechniques(this.academyId).pipe(
      finalize(() => {
        this.setLoadingState(false);
      })
    ).subscribe({
      next: (response) => {
        const all = Object.values(response.byId || {});
        this.ngZone.run(() => {
          this.basicTechniques = all
            .filter((item) => item.category === 'Básica')
            .sort((a, b) => a.name.localeCompare(b.name));
          this.advancedTechniques = all
            .filter((item) => item.category === 'Avançada')
            .sort((a, b) => a.name.localeCompare(b.name));
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.errorMessage = error?.error?.error || 'Não foi possível carregar as técnicas.';
          this.cdr.detectChanges();
        });
      },
    });
  }

  createTechnique(): void {
    const name = this.newTechniqueName.trim();
    if (!name || this.isSaving || !this.academyId) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .createAcademyTechnique(this.academyId, {
        name,
        description: this.newTechniqueDescription.trim() || undefined,
        category: this.newTechniqueCategory,
      })
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.successMessage = response.message;
            this.newTechniqueName = '';
            this.newTechniqueDescription = '';
            this.cdr.detectChanges();
          });
          this.loadTechniques();
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.errorMessage = error?.error?.error || 'Falha ao cadastrar técnica.';
            this.cdr.detectChanges();
          });
        },
      });
  }

  deleteTechnique(technique: Technique): void {
    if (!this.academyId || this.deletingTechniqueIds.has(technique.techniqueId)) {
      return;
    }

    const confirmed = window.confirm(`Excluir a técnica ${technique.name}?`);
    if (!confirmed) {
      return;
    }

    this.deletingTechniqueIds.add(technique.techniqueId);
    this.errorMessage = '';
    this.successMessage = '';

    this.api.deleteAcademyTechnique(this.academyId, technique.techniqueId).pipe(
      finalize(() => {
        this.deletingTechniqueIds.delete(technique.techniqueId);
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.successMessage = response.message;
          this.basicTechniques = this.basicTechniques.filter((item) => item.techniqueId !== technique.techniqueId);
          this.advancedTechniques = this.advancedTechniques.filter((item) => item.techniqueId !== technique.techniqueId);
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.errorMessage = error?.error?.error || 'Falha ao excluir técnica.';
          this.cdr.detectChanges();
        });
      },
    });
  }

  isDeletingTechnique(techniqueId: string): boolean {
    return this.deletingTechniqueIds.has(techniqueId);
  }

  goBackHome(): void {
    this.router.navigate(['/home']);
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }
}
