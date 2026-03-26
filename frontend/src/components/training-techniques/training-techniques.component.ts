import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { TrainingTechniquesOfflineService } from '../../services/training-techniques-offline.service';
import {
  Technique,
  GetSessionTechniquesResponse,
  GetTechniquesResponse,
  TechniquePreset,
  ApplyPresetResponse,
  SelectTechniqueResponse,
  DeselectTechniqueResponse,
} from '../../types';

interface TechniqueGroup {
  category: string;
  expanded: boolean;
  techniqueIds: string[];
}

@Component({
  selector: 'app-training-techniques',
  standalone: false,
  templateUrl: './training-techniques.component.html',
  styleUrls: ['./training-techniques.component.scss'],
})
export class TrainingTechniquesComponent implements OnInit, OnDestroy {
  sessionId = '';
  allTechniques: Record<string, Technique> = {};
  techniqueGroups: TechniqueGroup[] = [];

  selectedTechniqueIds = new Set<string>();
  orderedSelectedTechniqueIds: string[] = [];
  selectedSummary$ = { count: 0, names: [] as string[] };

  isLoading = false;
  savingTechniqueIds = new Set<string>();
  addingCustom = false;
  savingPreset = false;
  loadingPresets = false;
  applyingPreset = false;
  reorderingTechniques = false;
  draggingTechniqueId: string | null = null;

  customTechniqueInput = '';
  customAutocomplete: Technique[] = [];
  showAutoComplete = false;

  presets: TechniquePreset[] = [];
  showSavePresetModal = false;
  presetName = '';
  suggestedPreset: TechniquePreset | null = null;
  showPresetSuggestion = false;

  errorMessage = '';
  infoMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private offline: TrainingTechniquesOfflineService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  get isSaving(): boolean {
    return (
      this.savingTechniqueIds.size > 0 ||
      this.addingCustom ||
      this.savingPreset ||
      this.applyingPreset ||
      this.reorderingTechniques
    );
  }

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    if (!this.sessionId) {
      this.errorMessage = 'Sessão inválida para adicionar técnicas.';
      return;
    }

    window.addEventListener('online', this.handleBackOnline);

    this.loadTechniques();
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.handleBackOnline);
  }

  goToProfessorTechniques(): void {
    this.router.navigate(['/professor/tecnicas']);
  }

  private handleBackOnline = async (): Promise<void> => {
    await this.syncOfflineQueue();
  };

  private async syncOfflineQueue(): Promise<void> {
    if (!navigator.onLine) {
      return;
    }

    const result = await this.offline.flush(this.sessionId);
    if (result.processed > 0) {
      this.infoMessage = `✓ ${result.processed} operação(ões) offline sincronizadas`;
      this.loadTechniques();
    }
  }

  private loadTechniques(): void {
    this.setLoadingState(true);
    this.errorMessage = '';
    this.infoMessage = '';

    this.api
      .getSessionTechniques(this.sessionId)
      .pipe(finalize(() => {
        this.setLoadingState(false);
      }))
      .subscribe({
        next: (response: GetSessionTechniquesResponse) => {
          this.applyTechniques(response);
          this.loadPresets();
          void this.syncOfflineQueue();
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.error || 'Não foi possível carregar as técnicas da sessão.';
        },
      });
  }

  private applyTechniques(response: GetSessionTechniquesResponse): void {
    this.allTechniques = response.allTechniques.byId;
    this.selectedTechniqueIds = new Set(response.selectedTechniqueIds);
    this.orderedSelectedTechniqueIds = [...response.selectedTechniqueIds];
    this.selectedSummary$ = response.summary;

    // Build groups from categories
    this.techniqueGroups = [];
    for (const category in response.allTechniques.categories) {
      const techniqueIds = response.allTechniques.categories[category];
      const isBasic = category === 'Básica';

      this.techniqueGroups.push({
        category,
        expanded: isBasic, // Básicas expanded, others collapsed
        techniqueIds,
      });
    }
  }

  private loadPresets(): void {
    this.loadingPresets = true;

    this.api.getProfessorTechniquePresets().subscribe({
      next: (response) => {
        this.presets = response.presets;

        // Check if there's a suggested preset (most recent or most used)
        if (this.presets.length > 0 && this.selectedTechniqueIds.size === 0) {
          this.suggestedPreset = this.presets[0];
          this.showPresetSuggestion = true;
        }

        this.loadingPresets = false;
      },
      error: (error) => {
        console.error('Erro ao carregar favoritos:', error);
        this.loadingPresets = false;
      },
    });
  }

  toggleTechnique(techniqueId: string): void {
    if (this.savingTechniqueIds.has(techniqueId)) {
      return;
    }

    const isSelected = this.selectedTechniqueIds.has(techniqueId);

    if (isSelected) {
      this.deselectTechnique(techniqueId);
    } else {
      this.selectTechnique(techniqueId);
    }
  }

  private selectTechnique(techniqueId: string): void {
    if (this.savingTechniqueIds.has(techniqueId)) {
      return;
    }

    const previousSelected = new Set(this.selectedTechniqueIds);
    const previousOrder = [...this.orderedSelectedTechniqueIds];
    const previousSummary = { ...this.selectedSummary$ };

    this.savingTechniqueIds.add(techniqueId);
    this.errorMessage = '';

    this.selectedTechniqueIds.add(techniqueId);
    if (!this.orderedSelectedTechniqueIds.includes(techniqueId)) {
      this.orderedSelectedTechniqueIds.push(techniqueId);
    }
    this.rebuildSummary();

    this.api.selectTechnique(this.sessionId, techniqueId).subscribe({
      next: (response: SelectTechniqueResponse) => {
        this.selectedTechniqueIds = new Set(response.selectedTechniqueIds);
        this.orderedSelectedTechniqueIds = [...response.selectedTechniqueIds];
        this.selectedSummary$ = response.summary;
        this.showPresetSuggestion = false;
        this.savingTechniqueIds.delete(techniqueId);
      },
      error: (error) => {
        if (this.isOfflineError(error)) {
          void this.offline.enqueue({
            type: 'select',
            sessionId: this.sessionId,
            payload: { techniqueId },
          });
          this.infoMessage = 'Sem conexão: seleção enfileirada para sincronização.';
        } else {
          this.selectedTechniqueIds = previousSelected;
          this.orderedSelectedTechniqueIds = previousOrder;
          this.selectedSummary$ = previousSummary;
          this.errorMessage =
            error?.error?.error || 'Falha ao selecionar técnica. Tente novamente.';
        }
        this.savingTechniqueIds.delete(techniqueId);
      },
    });
  }

  private deselectTechnique(techniqueId: string): void {
    if (this.savingTechniqueIds.has(techniqueId)) {
      return;
    }

    const previousSelected = new Set(this.selectedTechniqueIds);
    const previousOrder = [...this.orderedSelectedTechniqueIds];
    const previousSummary = { ...this.selectedSummary$ };

    this.savingTechniqueIds.add(techniqueId);
    this.errorMessage = '';

    this.selectedTechniqueIds.delete(techniqueId);
    this.orderedSelectedTechniqueIds = this.orderedSelectedTechniqueIds.filter((id) => id !== techniqueId);
    this.rebuildSummary();

    this.api.deselectTechnique(this.sessionId, techniqueId).subscribe({
      next: (response: DeselectTechniqueResponse) => {
        this.selectedTechniqueIds = new Set(response.selectedTechniqueIds);
        this.orderedSelectedTechniqueIds = [...response.selectedTechniqueIds];
        this.selectedSummary$ = response.summary;
        this.savingTechniqueIds.delete(techniqueId);
      },
      error: (error) => {
        if (this.isOfflineError(error)) {
          void this.offline.enqueue({
            type: 'deselect',
            sessionId: this.sessionId,
            payload: { techniqueId },
          });
          this.infoMessage = 'Sem conexão: remoção enfileirada para sincronização.';
        } else {
          this.selectedTechniqueIds = previousSelected;
          this.orderedSelectedTechniqueIds = previousOrder;
          this.selectedSummary$ = previousSummary;
          this.errorMessage =
            error?.error?.error || 'Falha ao desselecionar técnica. Tente novamente.';
        }
        this.savingTechniqueIds.delete(techniqueId);
      },
    });
  }

  isTechniqueSaving(techniqueId: string): boolean {
    return this.savingTechniqueIds.has(techniqueId);
  }

  isTechniqueSelected(techniqueId: string): boolean {
    return this.selectedTechniqueIds.has(techniqueId);
  }

  toggleGroup(group: TechniqueGroup): void {
    group.expanded = !group.expanded;
  }

  onCustomTechniqueInput(value: string): void {
    this.customTechniqueInput = value;

    if (value.length < 2) {
      this.showAutoComplete = false;
      this.customAutocomplete = [];
      return;
    }

    // Filter existing techniques for autocomplete
    const lowerValue = value.toLowerCase();
    this.customAutocomplete = Object.values(this.allTechniques)
      .filter(
        (t) =>
          t.name.toLowerCase().includes(lowerValue) &&
          !this.selectedTechniqueIds.has(t.techniqueId)
      )
      .slice(0, 5);

    this.showAutoComplete = this.customAutocomplete.length > 0;
  }

  selectFromAutocomplete(technique: Technique): void {
    this.customTechniqueInput = '';
    this.showAutoComplete = false;
    this.customAutocomplete = [];
    this.selectTechnique(technique.techniqueId);
  }

  addCustomTechnique(): void {
    if (!this.customTechniqueInput.trim() || this.addingCustom) {
      return;
    }

    const pendingName = this.customTechniqueInput.trim();
    this.setAddingCustomState(true);
    this.errorMessage = '';

    this.api
      .addCustomTechnique(this.sessionId, pendingName)
      .pipe(
        timeout(10000),
        finalize(() => {
          this.setAddingCustomState(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            const newTechnique = response?.technique;
            if (!newTechnique?.techniqueId) {
              this.errorMessage = 'Resposta inválida ao adicionar técnica customizada.';
              this.cdr.detectChanges();
              return;
            }

            this.allTechniques[newTechnique.techniqueId] = newTechnique;
            this.addTechniqueToGroup(newTechnique.category || 'Avançada', newTechnique.techniqueId);
            this.selectedTechniqueIds.add(newTechnique.techniqueId);
            if (!this.orderedSelectedTechniqueIds.includes(newTechnique.techniqueId)) {
              this.orderedSelectedTechniqueIds.push(newTechnique.techniqueId);
            }
            this.rebuildSummary();

            this.customTechniqueInput = '';
            this.showAutoComplete = false;
            this.customAutocomplete = [];
            this.infoMessage = `✓ Técnica '${newTechnique.name}' adicionada`;
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            if (this.isOfflineError(error)) {
              const pendingId = `offline-${Date.now()}`;
              this.allTechniques[pendingId] = {
                techniqueId: pendingId,
                name: pendingName,
                category: 'Avançada',
                displayOrder: 9999,
              };
              this.addTechniqueToGroup('Avançada', pendingId);
              this.selectedTechniqueIds.add(pendingId);
              this.orderedSelectedTechniqueIds.push(pendingId);
              this.rebuildSummary();
              void this.offline.enqueue({
                type: 'add-custom',
                sessionId: this.sessionId,
                payload: { name: pendingName },
              });
              this.customTechniqueInput = '';
              this.showAutoComplete = false;
              this.customAutocomplete = [];
              this.infoMessage = 'Sem conexão: técnica customizada enfileirada para sincronização.';
            } else {
              this.errorMessage =
                error?.error?.error || 'Falha ao adicionar técnica customizada.';
            }
            this.cdr.detectChanges();
          });
        },
      });
  }

  onSaveAsPreset(): void {
    if (this.selectedTechniqueIds.size === 0) {
      this.infoMessage = 'Selecione pelo menos 1 técnica para salvar como favorito.';
      return;
    }

    this.showSavePresetModal = true;
    this.presetName = '';
  }

  onCancelPresetModal(): void {
    this.showSavePresetModal = false;
    this.presetName = '';
  }

  onConfirmPresetModal(): void {
    if (!this.presetName.trim() || this.savingPreset) {
      return;
    }

    this.savingPreset = true;
    this.errorMessage = '';

    this.api
      .saveTechniquePreset({
        name: this.presetName.trim(),
        techniqueIds: [...this.orderedSelectedTechniqueIds],
      })
      .subscribe({
        next: (response) => {
          this.infoMessage = `✓ Favorito '${response.preset.name}' salvo com sucesso`;
          this.showSavePresetModal = false;
          this.presetName = '';
          this.presets.unshift(response.preset);
          this.savingPreset = false;
        },
        error: (error) => {
          if (this.isOfflineError(error)) {
            void this.offline.enqueue({
              type: 'save-preset',
              sessionId: this.sessionId,
              payload: {
                name: this.presetName.trim(),
                techniqueIds: [...this.orderedSelectedTechniqueIds],
              },
            });
            this.infoMessage = 'Sem conexão: favorito enfileirado para sincronização.';
            this.showSavePresetModal = false;
            this.presetName = '';
          } else {
            this.errorMessage =
              error?.error?.error || 'Falha ao salvar favorito. Tente novamente.';
          }
          this.savingPreset = false;
        },
      });
  }

  onRejectPresetSuggestion(): void {
    this.showPresetSuggestion = false;
  }

  applyPreset(preset: TechniquePreset): void {
    this.suggestedPreset = preset;
    this.onAcceptPresetSuggestion();
  }

  onAcceptPresetSuggestion(): void {
    if (!this.suggestedPreset) {
      return;
    }

    this.applyingPreset = true;
    this.errorMessage = '';

    this.api.applyTechniquePreset(this.sessionId, this.suggestedPreset.presetId).subscribe({
      next: (response: ApplyPresetResponse) => {
        this.selectedTechniqueIds = new Set(response.selectedTechniqueIds);
        this.orderedSelectedTechniqueIds = [...response.selectedTechniqueIds];
        this.selectedSummary$ = response.summary;
        this.infoMessage = `✓ Favorito '${response.presetName}' carregado (${response.selectedTechniqueIds.length} técnicas)`;
        this.showPresetSuggestion = false;
        this.applyingPreset = false;
      },
      error: (error) => {
        if (this.isOfflineError(error)) {
          void this.offline.enqueue({
            type: 'apply-preset',
            sessionId: this.sessionId,
            payload: { presetId: this.suggestedPreset!.presetId },
          });
          this.infoMessage = 'Sem conexão: aplicação de favorito enfileirada para sincronização.';
          this.showPresetSuggestion = false;
        } else {
          this.errorMessage =
            error?.error?.error || 'Falha ao aplicar favorito. Tente novamente.';
        }
        this.applyingPreset = false;
      },
    });
  }

  private isOfflineError(error: any): boolean {
    return !navigator.onLine || error?.status === 0;
  }

  private rebuildSummary(): void {
    const names = this.orderedSelectedTechniqueIds
      .map((id) => this.allTechniques[id]?.name)
      .filter((name): name is string => Boolean(name));

    this.selectedSummary$ = {
      count: this.orderedSelectedTechniqueIds.length,
      names,
    };
  }

  canMoveSelected(index: number, direction: -1 | 1): boolean {
    const target = index + direction;
    return target >= 0 && target < this.orderedSelectedTechniqueIds.length;
  }

  moveSelectedTechnique(index: number, direction: -1 | 1): void {
    if (this.reorderingTechniques) {
      return;
    }

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.orderedSelectedTechniqueIds.length) {
      return;
    }

    const previousOrder = [...this.orderedSelectedTechniqueIds];
    const nextOrder = [...this.orderedSelectedTechniqueIds];
    const [moved] = nextOrder.splice(index, 1);
    nextOrder.splice(targetIndex, 0, moved);

    this.persistTechniqueOrder(nextOrder, previousOrder);
  }

  onTechniqueDragStart(event: DragEvent, techniqueId: string): void {
    this.draggingTechniqueId = techniqueId;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', techniqueId);
    }
  }

  onTechniqueDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onTechniqueDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();

    const droppedId = event.dataTransfer?.getData('text/plain') || this.draggingTechniqueId;
    if (!droppedId) {
      this.draggingTechniqueId = null;
      return;
    }

    const fromIndex = this.orderedSelectedTechniqueIds.indexOf(droppedId);
    if (fromIndex < 0 || fromIndex === targetIndex) {
      this.draggingTechniqueId = null;
      return;
    }

    const previousOrder = [...this.orderedSelectedTechniqueIds];
    const nextOrder = [...this.orderedSelectedTechniqueIds];
    const [moved] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);

    this.persistTechniqueOrder(nextOrder, previousOrder);
    this.draggingTechniqueId = null;
  }

  onTechniqueDragEnd(): void {
    this.draggingTechniqueId = null;
  }

  private persistTechniqueOrder(nextOrder: string[], previousOrder: string[]): void {
    if (this.reorderingTechniques) {
      return;
    }

    this.orderedSelectedTechniqueIds = nextOrder;
    this.rebuildSummary();
    this.reorderingTechniques = true;
    this.errorMessage = '';

    this.api.reorderSessionTechniques(this.sessionId, nextOrder).subscribe({
      next: (response) => {
        this.selectedTechniqueIds = new Set(response.selectedTechniqueIds);
        this.orderedSelectedTechniqueIds = [...response.selectedTechniqueIds];
        this.selectedSummary$ = response.summary;
        this.reorderingTechniques = false;
      },
      error: (error) => {
        this.orderedSelectedTechniqueIds = previousOrder;
        this.selectedTechniqueIds = new Set(previousOrder);
        this.rebuildSummary();
        this.errorMessage = error?.error?.error || 'Falha ao reordenar técnicas. Tente novamente.';
        this.reorderingTechniques = false;
      },
    });
  }

  private addTechniqueToGroup(category: string, techniqueId: string): void {
    const existing = this.techniqueGroups.find((group) => group.category === category);
    if (existing) {
      if (existing.techniqueIds.includes(techniqueId)) {
        return;
      }
      existing.techniqueIds = [...existing.techniqueIds, techniqueId];
      return;
    }

    this.techniqueGroups.push({
      category,
      expanded: false,
      techniqueIds: [techniqueId],
    });
  }

  onBackToAttendance(): void {
    this.router.navigate(['/training/session', this.sessionId, 'attendance']);
  }

  onNextNotes(): void {
    if (this.isSaving) {
      this.infoMessage = 'Aguarde a conclusão do salvamento antes de avançar.';
      return;
    }

    if (this.selectedTechniqueIds.size < 1) {
      this.infoMessage = 'Selecione pelo menos 1 técnica para avançar.';
      return;
    }

    this.infoMessage = '';
    this.router.navigate(['/training/session', this.sessionId, 'notes']);
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }

  private setAddingCustomState(value: boolean): void {
    this.ngZone.run(() => {
      this.addingCustom = value;
      this.cdr.detectChanges();
    });
  }
}
