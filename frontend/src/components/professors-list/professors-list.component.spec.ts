import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ProfessorsListComponent } from './professors-list.component';
import { ApiService } from '../../services/api.service';

describe('ProfessorsListComponent', () => {
  let component: ProfessorsListComponent;
  let fixture: ComponentFixture<ProfessorsListComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['listProfessors', 'updateProfessorStatus']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    apiSpy.listProfessors.and.returnValue(
      of({
        professors: [
          {
            id: 'prof-1',
            fullName: 'Ana Professora',
            email: 'ana@test.com',
            role: 'Professor',
            academyId: 'academy-1',
            isActive: true,
          },
        ],
        filters: { status: 'all' },
        total: 1,
      })
    );
    apiSpy.updateProfessorStatus.and.returnValue(
      of({
        message: 'Professor desativado com sucesso',
        professor: {
          id: 'prof-1',
          fullName: 'Ana Professora',
          email: 'ana@test.com',
          role: 'Professor',
          academyId: 'academy-1',
          isActive: false,
        },
      })
    );

    await TestBed.configureTestingModule({
      declarations: [ProfessorsListComponent],
      imports: [FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega lista de professores no init', () => {
    expect(apiSpy.listProfessors).toHaveBeenCalled();
    expect(component.professors.length).toBe(1);
    expect(component.professors[0].fullName).toBe('Ana Professora');
  });

  it('aplica filtros por nome e status', () => {
    component.filterName = 'ana';
    component.filterStatus = 'active';

    component.loadProfessors();

    expect(apiSpy.listProfessors).toHaveBeenCalledWith({
      name: 'ana',
      status: 'active',
    });
  });

  it('navega para formulario de novo professor', () => {
    component.goToNewProfessor();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/professores/novo']);
  });

  it('exibe erro quando listagem falha', () => {
    apiSpy.listProfessors.and.returnValue(
      throwError(() => ({
        error: { error: 'Falha na API' },
      }))
    );

    component.loadProfessors();

    expect(component.errorMessage).toBe('Falha na API');
    expect(component.loading).toBeFalse();
  });
});
