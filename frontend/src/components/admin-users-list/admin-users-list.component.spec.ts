import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AdminUsersListComponent } from './admin-users-list.component';
import { ApiService } from '../../services/api.service';

describe('AdminUsersListComponent', () => {
  let component: AdminUsersListComponent;
  let fixture: ComponentFixture<AdminUsersListComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'listAdminUsers',
      'createAdminManagedUser',
      'updateAdminManagedUser',
      'deleteAdminManagedUser',
      'exportAdminUsersCsv',
    ]);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    apiSpy.listAdminUsers.and.returnValue(
      of({
        users: [
          {
            id: 'user-1',
            fullName: 'Ana Admin',
            email: 'ana@test.com',
            role: 'Admin',
            isActive: true,
            status: 'active',
            createdAt: '2026-03-29T10:00:00.000Z',
            deletedAt: null,
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
        filters: {
          role: 'all',
          status: 'all',
          search: '',
        },
      }) as any
    );

    await TestBed.configureTestingModule({
      declarations: [AdminUsersListComponent],
      imports: [FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUsersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega usuarios no init', () => {
    expect(apiSpy.listAdminUsers).toHaveBeenCalled();
    expect(component.users.length).toBe(1);
    expect(component.users[0].fullName).toBe('Ana Admin');
  });

  it('navega para dashboard ao clicar voltar', () => {
    component.goToDashboard();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('abre modal de criacao', () => {
    component.openCreateModal();
    expect(component.showCreateModal).toBeTrue();
  });
});
