import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { User } from '../../types';

interface ShellMenuItem {
  key: string;
  label: string;
  icon: string;
  route: string;
  roles: Array<User['role']>;
}

interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-authenticated-shell',
  standalone: false,
  templateUrl: './authenticated-shell.component.html',
  styleUrls: ['./authenticated-shell.component.scss'],
})
export class AuthenticatedShellComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  breadcrumbs: BreadcrumbItem[] = [];
  isMobileMenuOpen = false;
  private userSub?: Subscription;
  private routerSub?: Subscription;
  private readonly menuItems: ShellMenuItem[] = [
    { key: 'home', label: 'Início', icon: '🏠', route: '/home', roles: ['Professor', 'Aluno'] },
    { key: 'dashboard', label: 'Dashboard', icon: '📊', route: '/admin/dashboard', roles: ['Admin'] },
    { key: 'students', label: 'Alunos', icon: '🎓', route: '/admin/alunos', roles: ['Admin'] },
    { key: 'professors', label: 'Professores', icon: '👨‍🏫', route: '/admin/professores', roles: ['Admin'] },
    { key: 'academy-profile', label: 'Academia', icon: '🏢', route: '/admin/perfil-academia', roles: ['Admin'] },
    { key: 'admin-profile', label: 'Meu perfil', icon: '👤', route: '/admin/meu-perfil', roles: ['Admin'] },
    { key: 'my-students', label: 'Meus alunos', icon: '🥋', route: '/professores/meus-alunos', roles: ['Professor'] },
    { key: 'classes', label: 'Turmas', icon: '📚', route: '/professor/turmas', roles: ['Professor'] },
    { key: 'techniques', label: 'Técnicas', icon: '🧠', route: '/professor/tecnicas', roles: ['Professor'] },
    { key: 'indicator-config', label: 'Indicadores', icon: '🧮', route: '/athlete-progress/configuration', roles: ['Admin', 'Professor'] },
    { key: 'professor-profile', label: 'Meu perfil', icon: '👤', route: '/professor/meu-perfil', roles: ['Professor'] },
    { key: 'student-profile', label: 'Meu perfil', icon: '👤', route: '/aluno/meu-perfil', roles: ['Aluno'] },
    { key: 'student-progress', label: 'Meu progresso', icon: '📈', route: '/athlete-progress/self/dashboard', roles: ['Aluno'] },
    { key: 'guardian-home', label: 'Área do responsável', icon: '🧭', route: '/home', roles: ['Responsavel'] },
  ];

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.refreshRouteState(this.router.url);

    this.userSub = this.auth.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.refreshRouteState(event.urlAfterRedirects);
        this.closeMobileMenu();
      });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  navigateTo(item: ShellMenuItem): void {
    const route = this.resolveRoute(item.route);
    this.router.navigate(route);
    this.closeMobileMenu();
  }

  getVisibleMenuItems(): ShellMenuItem[] {
    const role = this.currentUser?.role;
    if (!role) {
      return [];
    }

    return this.menuItems.filter((item) => item.roles.includes(role));
  }

  isRouteActive(item: ShellMenuItem): boolean {
    const route = this.normalizeUrl(this.resolveRoute(item.route).join('/'));
    const current = this.normalizeUrl(this.router.url || '');

    if (route === '/home') {
      return current === '/home';
    }

    return current.startsWith(route);
  }

  getAcademyLogo(): string {
    return this.currentUser?.academy?.logoUrl || 'assets/default-academy-logo.svg';
  }

  getUserPhoto(): string {
    return this.currentUser?.photoUrl || 'assets/default-user-photo.svg';
  }

  private refreshRouteState(url: string): void {
    this.breadcrumbs = this.buildBreadcrumbs(url);
  }

  private buildBreadcrumbs(url: string): BreadcrumbItem[] {
    const normalizedUrl = this.normalizeUrl(url);
    const segments = normalizedUrl.split('/').filter(Boolean);
    const labels: Record<string, string> = {
      home: 'Início',
      admin: 'Admin',
      dashboard: 'Dashboard',
      alunos: 'Alunos',
      professores: 'Professores',
      'meus-alunos': 'Alunos',
      ficha: 'Ficha',
      editar: 'Editar',
      novo: 'Novo',
      'meu-perfil': 'Meu perfil',
      'perfil-academia': 'Perfil da academia',
      'audit-logs': 'Auditoria',
      'consent-templates': 'Termos',
      'compliance-reports': 'Relatórios',
      professor: 'Professor',
      turma: 'Turma',
      turmas: 'Turmas',
      tecnicas: 'Técnicas',
      aluno: 'Aluno',
      'athlete-progress': 'Evolução',
      configuration: 'Indicadores',
      'health-screening': 'Anamnese',
      evaluation: 'Avaliação',
      training: 'Treino',
      session: 'Sessão',
      attendance: 'Presença',
      notes: 'Observações',
      review: 'Revisão',
      success: 'Conclusão',
      history: 'Histórico',
      backup: 'Backup',
      'health-monitor': 'Monitoramento',
      users: 'Usuários',
      perfil: 'Perfil',
      consent: 'Consentimento',
    };

    const crumbs: BreadcrumbItem[] = [];
    const pathAcc: string[] = [];

    for (const segment of segments) {
      if (this.shouldSkipSegment(segment)) {
        continue;
      }

      pathAcc.push(segment);
      crumbs.push({
        label: labels[segment] || this.toTitle(segment),
        route: `/${pathAcc.join('/')}`,
      });
    }

    return crumbs;
  }

  private shouldSkipSegment(segment: string): boolean {
    return /^[0-9]+$/.test(segment)
      || /^(student|user|prof|academy|guardian|session)-/i.test(segment)
      || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(segment);
  }

  private resolveRoute(route: string): string[] {
    if (route === '/athlete-progress/self/dashboard') {
      const studentId = this.currentUser?.id || 'me';
      return ['/athlete-progress', studentId, 'dashboard'];
    }

    return [route];
  }

  private normalizeUrl(url: string): string {
    const cleanUrl = (url || '').split('?')[0];
    return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  }

  private toTitle(value: string): string {
    return value
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
