import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-setup',
  standalone: false,
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss'],
})
export class SetupComponent implements OnInit {
  currentStep = 1;
  academyId: string = '';
  academyName: string = '';
  academyEmail: string = '';
  adminFullName: string = '';
  adminEmail: string = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkSetupNeeded();
  }

  checkSetupNeeded(): void {
    this.api.checkSetupNeeded().subscribe(
      (response: any) => {
        if (!response.needsSetup) {
          // Academy already exists — go to login instead of dashboard
          this.router.navigate(['/login']);
        }
      },
      (error: any) => {
        console.error('Error checking setup status:', error);
      }
    );
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
