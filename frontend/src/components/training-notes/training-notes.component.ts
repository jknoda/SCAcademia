import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import {
  GetSessionNotesResponse,
  PresentStudent,
} from '../../types';

type CounterMode = 'chars' | 'words';

@Component({
  selector: 'app-training-notes',
  standalone: false,
  templateUrl: './training-notes.component.html',
  styleUrls: ['./training-notes.component.scss'],
})
export class TrainingNotesComponent implements OnInit, OnDestroy {
  private readonly generalMaxChars = 400;
  private readonly studentMaxChars = 200;
  private readonly debounceMs = 5000;

  sessionId = '';
  generalNotes = '';
  charCount = 0;
  counterMode: CounterMode = 'chars';

  presentStudents: PresentStudent[] = [];
  expandedStudentIds = new Set<string>();
  studentNoteMap: Record<string, string> = {};

  isLoading = false;
  isSavedLocally = false;
  showSaveIcon = false;
  savingGeneral = false;
  savingStudentIds = new Set<string>();
  errorMessage = '';
  infoMessage = '';

  private lastGeneralSaved = '';
  private lastStudentSaved: Record<string, string> = {};
  private debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
  private saveIconTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    if (!this.sessionId) {
      this.errorMessage = 'Sessão inválida para anotações.';
      return;
    }

    window.addEventListener('online', this.handleBackOnline);
    this.loadNotes();
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.handleBackOnline);
    this.flushPendingSaves();
    this.clearAllTimers();

    if (this.saveIconTimer) {
      clearTimeout(this.saveIconTimer);
      this.saveIconTimer = null;
    }
  }

  get wordsCount(): number {
    const trimmed = this.generalNotes.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }

  isStudentSaving(studentId: string): boolean {
    return this.savingStudentIds.has(studentId);
  }

  isStudentExpanded(studentId: string): boolean {
    return this.expandedStudentIds.has(studentId);
  }

  getStudentCharCount(studentId: string): number {
    return (this.studentNoteMap[studentId] || '').length;
  }

  toggleCounterMode(): void {
    this.counterMode = this.counterMode === 'chars' ? 'words' : 'chars';
  }

  toggleStudentSection(studentId: string): void {
    if (this.expandedStudentIds.has(studentId)) {
      this.expandedStudentIds.delete(studentId);
      return;
    }

    this.expandedStudentIds.add(studentId);
  }

  onGeneralNotesInput(value: string, textarea: HTMLTextAreaElement): void {
    this.errorMessage = '';
    this.generalNotes = value.slice(0, this.generalMaxChars);
    this.charCount = this.generalNotes.length;
    this.autoExpand(textarea);
    this.scheduleGeneralSave();
  }

  onStudentNotesInput(studentId: string, value: string, textarea: HTMLTextAreaElement): void {
    this.errorMessage = '';
    this.studentNoteMap[studentId] = value.slice(0, this.studentMaxChars);
    this.autoExpand(textarea);
    this.scheduleStudentSave(studentId);
  }

  onBackToTechniques(): void {
    this.flushPendingSaves();
    this.router.navigate(['/training/session', this.sessionId, 'techniques']);
  }

  onNextToReview(): void {
    this.flushPendingSaves();
    this.router.navigate(['/training/session', this.sessionId, 'review']);
  }

  autoExpand(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  private loadNotes(): void {
    this.setLoadingState(true);
    this.errorMessage = '';
    this.infoMessage = '';

    this.api
      .getSessionNotes(this.sessionId)
      .pipe(finalize(() => {
        this.setLoadingState(false);
      }))
      .subscribe({
        next: (response: GetSessionNotesResponse) => {
          this.applyNotesResponse(response);
          this.tryLoadLocalDrafts();
          void this.syncOfflineLocal();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || 'Não foi possível carregar as anotações da sessão.';
          this.tryLoadLocalDrafts();
        },
      });
  }

  private applyNotesResponse(response: GetSessionNotesResponse): void {
    this.generalNotes = response.generalNotes || '';
    this.charCount = this.generalNotes.length;
    this.lastGeneralSaved = this.generalNotes;

    this.presentStudents = response.presentStudents;
    this.studentNoteMap = {};
    this.lastStudentSaved = {};
    this.expandedStudentIds.clear();

    for (const note of response.studentNotes) {
      this.studentNoteMap[note.studentId] = note.content;
      this.lastStudentSaved[note.studentId] = note.content;
      this.expandedStudentIds.add(note.studentId);
    }
  }

  private scheduleGeneralSave(): void {
    this.clearTimer('general');
    this.debounceTimers['general'] = setTimeout(() => {
      this.saveGeneralNotes();
    }, this.debounceMs);
  }

  private scheduleStudentSave(studentId: string): void {
    const key = this.studentTimerKey(studentId);
    this.clearTimer(key);
    this.debounceTimers[key] = setTimeout(() => {
      this.saveStudentNote(studentId);
    }, this.debounceMs);
  }

  private saveGeneralNotes(force = false): void {
    if (!force && this.generalNotes === this.lastGeneralSaved) {
      return;
    }

    this.savingGeneral = true;

    this.api
      .saveSessionNotes(this.sessionId, this.generalNotes)
      .pipe(finalize(() => {
        this.savingGeneral = false;
      }))
      .subscribe({
        next: () => {
          this.lastGeneralSaved = this.generalNotes;
          this.removeFromLocalStorage(this.getGeneralStorageKey());
          this.isSavedLocally = false;
          this.pulseSaveIcon();
        },
        error: (error) => {
          if (this.isOfflineError(error)) {
            this.saveToLocalStorage(this.getGeneralStorageKey(), this.generalNotes);
            this.isSavedLocally = true;
            this.infoMessage = 'Sem conexão: nota geral salva localmente.';
            return;
          }

          this.errorMessage = error?.error?.error || 'Falha ao salvar nota geral.';
        },
      });
  }

  private saveStudentNote(studentId: string, force = false): void {
    const content = this.studentNoteMap[studentId] || '';
    if (!force && content === (this.lastStudentSaved[studentId] || '')) {
      return;
    }

    this.savingStudentIds.add(studentId);

    this.api
      .saveStudentNote(this.sessionId, studentId, content)
      .pipe(finalize(() => {
        this.savingStudentIds.delete(studentId);
      }))
      .subscribe({
        next: () => {
          this.lastStudentSaved[studentId] = content;
          this.removeFromLocalStorage(this.getStudentStorageKey(studentId));
          this.isSavedLocally = false;
          this.pulseSaveIcon();
        },
        error: (error) => {
          if (this.isOfflineError(error)) {
            this.saveToLocalStorage(this.getStudentStorageKey(studentId), content);
            this.isSavedLocally = true;
            this.infoMessage = 'Sem conexão: anotação por aluno salva localmente.';
            return;
          }

          this.errorMessage = error?.error?.error || 'Falha ao salvar anotação do aluno.';
        },
      });
  }

  private flushPendingSaves(): void {
    this.clearAllTimers();
    this.saveGeneralNotes(true);

    for (const student of this.presentStudents) {
      this.saveStudentNote(student.userId, true);
    }
  }

  private handleBackOnline = async (): Promise<void> => {
    await this.syncOfflineLocal();
  };

  private async syncOfflineLocal(): Promise<void> {
    if (!navigator.onLine) {
      return;
    }

    const generalDraft = localStorage.getItem(this.getGeneralStorageKey());
    if (generalDraft !== null) {
      this.generalNotes = generalDraft.slice(0, this.generalMaxChars);
      this.charCount = this.generalNotes.length;
      this.saveGeneralNotes(true);
    }

    const studentKeys: string[] = [];
    const prefix = `${this.getGeneralStorageKey()}_`;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        studentKeys.push(key);
      }
    }

    for (const key of studentKeys) {
      const studentId = key.slice(prefix.length);
      const value = localStorage.getItem(key);
      if (value !== null) {
        this.studentNoteMap[studentId] = value.slice(0, this.studentMaxChars);
        this.saveStudentNote(studentId, true);
      }
    }
  }

  private tryLoadLocalDrafts(): void {
    const localGeneral = localStorage.getItem(this.getGeneralStorageKey());
    if (localGeneral !== null) {
      this.generalNotes = localGeneral.slice(0, this.generalMaxChars);
      this.charCount = this.generalNotes.length;
      this.isSavedLocally = true;
      this.infoMessage = 'Rascunho local carregado.';
    }

    const prefix = `${this.getGeneralStorageKey()}_`;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) {
        continue;
      }

      const studentId = key.slice(prefix.length);
      const value = localStorage.getItem(key) || '';
      this.studentNoteMap[studentId] = value.slice(0, this.studentMaxChars);
      this.expandedStudentIds.add(studentId);
      this.isSavedLocally = true;
    }
  }

  private clearAllTimers(): void {
    for (const key of Object.keys(this.debounceTimers)) {
      clearTimeout(this.debounceTimers[key]);
      delete this.debounceTimers[key];
    }
  }

  private clearTimer(key: string): void {
    const timer = this.debounceTimers[key];
    if (timer) {
      clearTimeout(timer);
      delete this.debounceTimers[key];
    }
  }

  private studentTimerKey(studentId: string): string {
    return `student_${studentId}`;
  }

  private isOfflineError(error: any): boolean {
    return !navigator.onLine || error?.status === 0;
  }

  private getGeneralStorageKey(): string {
    return `training_notes_${this.sessionId}`;
  }

  private getStudentStorageKey(studentId: string): string {
    return `${this.getGeneralStorageKey()}_${studentId}`;
  }

  private saveToLocalStorage(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  private removeFromLocalStorage(key: string): void {
    localStorage.removeItem(key);
  }

  private pulseSaveIcon(): void {
    this.showSaveIcon = true;

    if (this.saveIconTimer) {
      clearTimeout(this.saveIconTimer);
    }

    this.saveIconTimer = setTimeout(() => {
      this.showSaveIcon = false;
      this.saveIconTimer = null;
    }, 700);
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }
}
