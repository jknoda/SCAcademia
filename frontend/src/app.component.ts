import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'SCAcademia Setup';
  useAuthenticatedShell = false;
  private routerSub?: Subscription;
  private readonly publicRoutes = ['/setup', '/login', '/register', '/forgot-password', '/reset-password'];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateShellMode(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateShellMode(event.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private updateShellMode(url: string): void {
    const cleanUrl = (url || '').split('?')[0];
    const isConsentRoute = cleanUrl.startsWith('/consent/');
    const isPublicRoute = this.publicRoutes.some((route) => cleanUrl === route || cleanUrl.startsWith(`${route}/`));

    this.useAuthenticatedShell = !isConsentRoute && !isPublicRoute;
  }
}
