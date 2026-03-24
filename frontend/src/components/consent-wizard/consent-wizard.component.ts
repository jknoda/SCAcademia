import { ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { ConsentValidation, ConsentTemplate } from '../../types';

@Component({
  selector: 'app-consent-wizard',
  standalone: false,
  templateUrl: './consent-wizard.component.html',
  styleUrls: ['./consent-wizard.component.scss'],
})
export class ConsentWizardComponent implements OnInit {
  @ViewChild('sigPad') sigPad!: ElementRef<HTMLCanvasElement>;

  currentStep = 1;
  token = '';

  tokenData: ConsentValidation | null = null;
  privacyTemplate: ConsentTemplate | null = null;
  healthTemplate: ConsentTemplate | null = null;
  ethicsTemplate: ConsentTemplate | null = null;

  // Re-consent comparison templates
  privacyOldTemplate: ConsentTemplate | null = null;
  healthOldTemplate: ConsentTemplate | null = null;
  ethicsOldTemplate: ConsentTemplate | null = null;
  private showComparison = false;
  private expandedComparisons: { [key: string]: boolean } = {};

  privacyScrolled = false;
  healthAccepted = false;
  ethicsAccepted = false;

  isLoading = false;
  errorMessage = '';
  successStudentName = '';

  private isDrawing = false;
  private ctx: CanvasRenderingContext2D | null = null;
  private lastX = 0;
  private lastY = 0;
  hasSignature = false;
  private initialLoadWatchdogId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.errorMessage = 'Link de consentimento inválido.';
      return;
    }

    this.initialLoadWatchdogId = setTimeout(() => {
      if (this.currentStep === 1 && this.isLoading) {
        this.errorMessage = 'A validação do link de consentimento demorou mais do que o esperado.';
        this.setLoadingState(false);
      }
    }, 12000);

    this.setLoadingState(true);
    this.api
      .validateConsentToken(this.token)
      .pipe(
        timeout(10000),
        catchError(() => {
          this.errorMessage = 'Link de consentimento inválido ou expirado. Solicite um novo link ao responsável da academia.';
          return of(null);
        }),
        finalize(() => {
          if (this.initialLoadWatchdogId) {
            clearTimeout(this.initialLoadWatchdogId);
            this.initialLoadWatchdogId = null;
          }

          if (!this.tokenData && !this.errorMessage) {
            this.errorMessage = 'Não foi possível validar o link de consentimento no momento.';
          }
          if (!this.tokenData) {
            this.setLoadingState(false);
          }
        })
      )
      .subscribe((data) => {
        if (!data) {
          return;
        }

        this.tokenData = data;
        if (data.isReconsent && data.previousVersion && data.newVersion) {
          this.loadReconsentComparison(data.previousVersion, data.newVersion);
        } else {
          this.loadPrivacyTemplate();
        }
      });
  }

  private loadReconsentComparison(oldVersion: number, newVersion: number): void {
    this.showComparison = true;

    const safe = (stream: Observable<ConsentTemplate>) =>
      stream.pipe(
        timeout(10000),
        catchError(() => of<ConsentTemplate | null>(null))
      );

    forkJoin({
      privacyOld: safe(this.api.getConsentTemplateByVersion(this.token, 'privacy', oldVersion)),
      healthOld: safe(this.api.getConsentTemplateByVersion(this.token, 'health', oldVersion)),
      ethicsOld: safe(this.api.getConsentTemplateByVersion(this.token, 'ethics', oldVersion)),
      privacyNew: safe(this.api.getConsentTemplate(this.token, 'privacy')),
      healthNew: safe(this.api.getConsentTemplate(this.token, 'health')),
      ethicsNew: safe(this.api.getConsentTemplate(this.token, 'ethics')),
    })
      .pipe(
        finalize(() => {
          this.currentStep = 1;
          this.setLoadingState(false);
        })
      )
      .subscribe((result) => {
        this.privacyOldTemplate = result.privacyOld;
        this.healthOldTemplate = result.healthOld;
        this.ethicsOldTemplate = result.ethicsOld;
        this.privacyTemplate = result.privacyNew;
        this.healthTemplate = result.healthNew;
        this.ethicsTemplate = result.ethicsNew;

        if (!result.privacyNew && !result.healthNew && !result.ethicsNew) {
          this.errorMessage = 'Não foi possível carregar os termos de consentimento.';
        }
      });
  }

  private loadPrivacyTemplate(): void {
    this.api
      .getConsentTemplate(this.token, 'privacy')
      .pipe(
        timeout(10000),
        catchError(() => {
          this.errorMessage = 'Erro ao carregar termos de privacidade.';
          return of(null);
        }),
        finalize(() => this.setLoadingState(false))
      )
      .subscribe((tmpl) => {
        if (!tmpl) {
          return;
        }
        this.privacyTemplate = tmpl;
        this.currentStep = 2;
      });
  }

  onPrivacyScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const threshold = 50;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
      this.privacyScrolled = true;
    }
  }

  goToStep3(): void {
    this.setLoadingState(true);
    this.errorMessage = '';

    forkJoin({
      health: this.api.getConsentTemplate(this.token, 'health').pipe(
        timeout(10000),
        catchError(() => of(null))
      ),
      ethics: this.api.getConsentTemplate(this.token, 'ethics').pipe(
        timeout(10000),
        catchError(() => of(null))
      ),
    })
      .pipe(finalize(() => this.setLoadingState(false)))
      .subscribe((result) => {
        if (!result.health || !result.ethics) {
          this.errorMessage = 'Erro ao carregar termos de saúde e ética.';
          return;
        }

        this.healthTemplate = result.health as ConsentTemplate;
        this.ethicsTemplate = result.ethics as ConsentTemplate;
        this.currentStep = 3;
      });
  }

  goToStep4(): void {
    this.currentStep = 4;
    setTimeout(() => this.initCanvas(), 50);
  }

  private initCanvas(): void {
    const canvas = this.sigPad?.nativeElement;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.strokeStyle = '#1a1a2e';
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
  }

  onMouseDown(event: MouseEvent): void {
    this.isDrawing = true;
    const rect = this.sigPad.nativeElement.getBoundingClientRect();
    this.lastX = event.clientX - rect.left;
    this.lastY = event.clientY - rect.top;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDrawing || !this.ctx) return;
    event.preventDefault();
    const rect = this.sigPad.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.lastX = x;
    this.lastY = y;
    this.hasSignature = true;
  }

  onMouseUp(): void {
    this.isDrawing = false;
  }

  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    const rect = this.sigPad.nativeElement.getBoundingClientRect();
    this.isDrawing = true;
    this.lastX = touch.clientX - rect.left;
    this.lastY = touch.clientY - rect.top;
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDrawing || !this.ctx) return;
    event.preventDefault();
    const touch = event.touches[0];
    const rect = this.sigPad.nativeElement.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.lastX = x;
    this.lastY = y;
    this.hasSignature = true;
  }

  onTouchEnd(): void {
    this.isDrawing = false;
  }

  clearSignature(): void {
    if (!this.ctx) return;
    const canvas = this.sigPad.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasSignature = false;
  }

  // Re-consent methods
  toggleComparison(type: 'privacy' | 'health' | 'ethics'): void {
    this.expandedComparisons[type] = !this.expandedComparisons[type];
  }

  isComparisonExpanded(type: 'privacy' | 'health' | 'ethics'): boolean {
    return this.expandedComparisons[type] || false;
  }

  proceedFromReconsent(): void {
    this.showComparison = false;
    this.currentStep = 2;
    this.privacyScrolled = false;
  }

  quickSignReconsent(): void {
    // Skip to signature step for quick acceptance
    this.currentStep = 4;
    setTimeout(() => this.initCanvas(), 50);
  }

  submitConsent(): void {
    if (!this.hasSignature) return;
    const canvas = this.sigPad.nativeElement;
    const signatureBase64 = canvas.toDataURL('image/png');

    this.setLoadingState(true);
    this.errorMessage = '';

    this.api
      .signConsent(this.token, signatureBase64)
      .pipe(
        timeout(15000),
        catchError((err) => {
          this.errorMessage = err?.error?.error || 'Erro ao registrar consentimento. Tente novamente.';
          return of(null);
        }),
        finalize(() => this.setLoadingState(false))
      )
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.successStudentName = result.studentName;
        this.currentStep = 5;
      });
  }

  private setLoadingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = value;
      this.cdr.detectChanges();
    });
  }
}
