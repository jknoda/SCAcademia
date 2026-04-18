/// <reference types="jasmine" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

import { AuthenticatedShellComponent } from './authenticated-shell.component';
import { AuthService } from '../../services/auth.service';

describe('AuthenticatedShellComponent', () => {
  let component: AuthenticatedShellComponent;
  let fixture: ComponentFixture<AuthenticatedShellComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerEvents$: Subject<any>;
  const currentUser$ = new BehaviorSubject<any>({
    id: 'admin-1',
    fullName: 'Admin Teste',
    role: 'Admin',
    email: 'admin@test.com',
    academy: { id: 'academy-1', name: 'Academia Teste' },
  });

  beforeEach(async () => {
    routerEvents$ = new Subject<any>();
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate'], {
      url: '/admin/dashboard',
      events: routerEvents$.asObservable(),
    });
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser', 'logout'], {
      currentUser$: currentUser$.asObservable(),
    });
    authSpy.getCurrentUser.and.returnValue(currentUser$.value);

    await TestBed.configureTestingModule({
      declarations: [AuthenticatedShellComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthenticatedShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renderiza o cabeçalho mestre com os dados do usuário autenticado', () => {
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Academia Teste');
    expect(content).toContain('Bem-vindo, Admin Teste');
  });

  it('executa logout pelo cabeçalho compartilhado', () => {
    component.logout();

    expect(authSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('monta breadcrumbs com base na rota atual', () => {
    routerEvents$.next(new NavigationEnd(1, '/admin/alunos/student-1/ficha', '/admin/alunos/student-1/ficha'));

    expect(component.breadcrumbs.map((item: any) => item.label)).toEqual(['Admin', 'Alunos', 'Ficha']);
  });

  it('exibe menu lateral compatível com o papel autenticado', () => {
    const labels = component.getVisibleMenuItems().map((item: any) => item.label);

    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Alunos');
    expect(labels).not.toContain('Meu progresso');
  });

  it('alterna o menu móvel responsivo', () => {
    expect(component.isMobileMenuOpen).toBeFalse();

    component.toggleMobileMenu();
    expect(component.isMobileMenuOpen).toBeTrue();

    component.closeMobileMenu();
    expect(component.isMobileMenuOpen).toBeFalse();
  });
});
