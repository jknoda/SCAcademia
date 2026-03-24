import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser', 'logout'], {
      currentUser$: new BehaviorSubject({
        id: 'guardian-1',
        email: 'responsavel@test.com',
        fullName: 'Responsavel',
        role: 'Responsavel',
        academy: { id: 'academy-1', name: 'Academia' },
      }),
    });
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['listLinkedStudents']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    authSpy.getCurrentUser.and.returnValue({
      id: 'guardian-1',
      email: 'responsavel@test.com',
      fullName: 'Responsavel',
      role: 'Responsavel',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any);

    apiSpy.listLinkedStudents.and.returnValue(
      of({
        students: [
          {
            studentId: 'student-1',
            studentName: 'Filho Um',
            hasHealthScreening: false,
            healthScreeningUpdatedAt: null,
          },
        ],
      }) as any
    );

    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      imports: [FormsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('lista filhos com anamnese pendente para o responsável', () => {
    expect(component.studentsWithoutHealthScreening.length).toBe(1);
    expect(component.studentsWithoutHealthScreening[0].studentName).toBe('Filho Um');
  });

  it('navega para o formulário de anamnese com retorno para home', () => {
    component.goToStudentHealthScreening('student-1');

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/health-screening', 'student-1'], {
      queryParams: { returnTo: '/home' },
    });
  });
});