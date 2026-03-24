import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-setup',
  standalone: false,
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss'],
})
export class SetupComponent implements OnInit {
  currentStep = 1;
  isChecking = true;
  checkErrorMessage = '';
  academyId: string = '';
  academyName: string = '';
  academyEmail: string = '';
  adminFullName: string = '';
  adminEmail: string = '';
  private setupWatchdogId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private api: ApiService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkSetupNeeded();
  }

  checkSetupNeeded(): void {
    this.setupWatchdogId = setTimeout(() => {
      if (this.isChecking) {
        this.checkErrorMessage =
          'A verificação de setup demorou mais do que o esperado. Você pode continuar manualmente.';
        this.updateCheckingState(false);
      }
    }, 10000);

    this.api
      .checkSetupNeeded()
      .pipe(
        timeout(7000),
        catchError((error: any) => {
          console.error('Error checking setup status:', error);
          this.checkErrorMessage =
            'Não foi possível validar o setup automaticamente. Você pode continuar manualmente.';
          return of({ needsSetup: true });
        }),
        finalize(() => {
          if (this.setupWatchdogId) {
            clearTimeout(this.setupWatchdogId);
            this.setupWatchdogId = null;
          }
          this.updateCheckingState(false);
        })
      )
      .subscribe((response: any) => {
        if (!response.needsSetup) {
          this.router.navigate(['/login']);
        }
      });
  }

  private updateCheckingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isChecking = value;
      this.cdr.detectChanges();
    });
  }

  onAcademyCreated(event: { academyId: string; name: string; email: string }): void {
    this.academyId = event.academyId;
    this.academyName = event.name;
    this.academyEmail = event.email;
    localStorage.setItem('academyId', event.academyId);
    this.currentStep = 2;
  }

  onAdminCreated(event: { fullName: string; email: string }): void {
    this.adminFullName = event.fullName;
    this.adminEmail = event.email;
    this.currentStep = 3;
  }

  onLoginSuccess(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}
