import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';

import { AdminBackupRecoveryComponent } from './admin-backup-recovery.component';
import { ApiService } from '../../services/api.service';

describe('AdminBackupRecoveryComponent', () => {
  let component: AdminBackupRecoveryComponent;
  let fixture: ComponentFixture<AdminBackupRecoveryComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'listAdminBackups',
      'triggerAdminBackup',
      'getAdminBackupJobStatus',
      'downloadAdminBackup',
      'verifyAdminBackup',
      'restoreAdminBackup',
      'deleteAdminBackupJob',
      'upsertAdminBackupSchedule',
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    apiSpy.listAdminBackups.and.returnValue(
      of({
        jobs: [
          {
            id: 'job-1',
            academyId: 'academy-1',
            type: 'manual',
            status: 'completed',
            fileName: 'backup_2026-03-29_12-00-00.sql.gz',
            filePath: '/tmp/backup.sql.gz',
            fileSizeBytes: 1024,
            includeHistory: true,
            isEncrypted: false,
            initiatedBy: 'admin-1',
            startedAt: '2026-03-29T12:00:00.000Z',
            completedAt: '2026-03-29T12:00:05.000Z',
            errorMessage: null,
            downloadExpiresAt: '2026-03-30T12:00:05.000Z',
            retentionDays: 30,
            archivedAt: null,
            createdAt: '2026-03-29T12:00:00.000Z',
          },
        ],
        schedule: {
          academyId: 'academy-1',
          generatedBy: 'admin-1',
          frequency: 'daily',
          hour: 2,
          minute: 30,
          enabled: true,
          retentionDays: 30,
          nextRunAt: '2026-03-30T05:30:00.000Z',
          updatedAt: '2026-03-29T12:00:00.000Z',
        },
        lastAutoBackup: null,
      }) as any
    );
    apiSpy.getAdminBackupJobStatus.and.returnValue(of({ job: {} as any }));
    apiSpy.downloadAdminBackup.and.returnValue(of({} as any));
    apiSpy.verifyAdminBackup.and.returnValue(of({ valid: true, sizeBytes: 1024 }));
    apiSpy.restoreAdminBackup.and.returnValue(of({ message: 'ok' }));
    apiSpy.deleteAdminBackupJob.and.returnValue(of({ message: 'ok' }));
    apiSpy.upsertAdminBackupSchedule.and.returnValue(
      of({
        academyId: 'academy-1',
        generatedBy: 'admin-1',
        frequency: 'daily',
        hour: 3,
        minute: 15,
        enabled: true,
        retentionDays: 30,
        nextRunAt: '2026-03-30T06:15:00.000Z',
        updatedAt: '2026-03-29T12:00:00.000Z',
      }) as any
    );

    await TestBed.configureTestingModule({
      declarations: [AdminBackupRecoveryComponent],
      imports: [CommonModule, FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminBackupRecoveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega lista de backups e agendamento no init', () => {
    expect(apiSpy.listAdminBackups).toHaveBeenCalled();
    expect(component.jobs.length).toBe(1);
    expect(component.schedule?.hour).toBe(2);
  });

  it('entra em estado de loading ao disparar backup', () => {
    const triggerSubject = new Subject<any>();
    apiSpy.triggerAdminBackup.and.returnValue(triggerSubject.asObservable());

    component.openTriggerForm();
    component.triggerBackup();

    expect(component.isTriggeringBackup).toBeTrue();

    triggerSubject.next({ jobId: 'job-2', message: 'Backup iniciado com sucesso' });
    triggerSubject.complete();

    expect(apiSpy.triggerAdminBackup).toHaveBeenCalled();
  });

  it('exige senha antes de permitir restore', () => {
    const job = component.jobs[0];
    component.openRestoreModal(job);

    expect(component.canConfirmRestore()).toBeFalse();

    component.restorePayload.adminPassword = 'SenhaForte1!';

    expect(component.canConfirmRestore()).toBeTrue();
  });
});