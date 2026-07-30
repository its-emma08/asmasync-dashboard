import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { HospitalDashboardComponent } from './hospital-dashboard.component';
import { HospitalService } from '../../../core/services/hospital.service';
import { LoadingService } from '../../../core/services/loading.service';
import { PdfExportService } from '../../../core/services/pdf-export.service';
import { NotificationService } from '../../../core/services/notification.service';

describe('HospitalDashboardComponent', () => {
  let component: HospitalDashboardComponent;
  let fixture: ComponentFixture<HospitalDashboardComponent>;

  const mockStats = {
    hospital_name: 'Hospital General Test',
    total_patients: 20,
    zones: {
      green: 12,
      yellow: 5,
      red: 3
    },
    doctor_performance: [
      { doctor_id: 101, doctor_name: 'Dr. House', patient_count: 8 },
      { doctor_id: 102, doctor_name: 'Dr. Strange', patient_count: 4 },
      { doctor_id: 103, doctor_name: 'Dr. Ted', patient_count: 0 }
    ]
  };

  const mockDoctors = [
    { id: 101, full_name: 'Dr. House', specialty: 'Diagnóstico', email: 'house@test.com', is_active: true, is_verified: true },
    { id: 102, full_name: 'Dr. Strange', specialty: 'Mago', email: 'strange@test.com', is_active: false, is_verified: false },
    { id: 103, full_name: 'Dr. Ted', specialty: 'General', email: 'ted@test.com', is_active: true, is_verified: true }
  ];

  const mockPatients = [
    { id: 50, full_name: 'Patient One', email: 'one@test.com', assigned_doctor: null },
    { id: 51, full_name: 'Patient Two', email: 'two@test.com', assigned_doctor: { full_name: 'Dr. House' } }
  ];

  const mockHospitalService = {
    getHospitalStats: vi.fn().mockReturnValue(of(mockStats)),
  };

  const mockLoadingService = {
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
  };

  const mockHttpClient = {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes('/admin/doctors')) {
        return of(mockDoctors);
      }
      if (url.includes('/admin/patients')) {
        return of(mockPatients);
      }
      return of([]);
    }),
    post: vi.fn().mockReturnValue(of({ success: true })),
    patch: vi.fn().mockReturnValue(of({ success: true }))
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  const mockDialogRef = {
    close: vi.fn(),
    afterClosed: vi.fn().mockReturnValue(of(null)),
  };

  const mockDialog = {
    open: vi.fn().mockReturnValue(mockDialogRef),
  };

  const mockPdfExportService = {
    exportFromHtml: vi.fn().mockResolvedValue(undefined),
    sanitizeName: vi.fn().mockImplementation((name: string) => name),
  };

  const mockNotificationService = {
    sendLocalNotification: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [
        HospitalDashboardComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: HospitalService, useValue: mockHospitalService },
        { provide: LoadingService, useValue: mockLoadingService },
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog },
        { provide: PdfExportService, useValue: mockPdfExportService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    })
    .overrideComponent(HospitalDashboardComponent, {
      set: {
        template: '<div data-testid="hospital-stub"></div>',
        providers: [
          { provide: HospitalService, useValue: mockHospitalService },
          { provide: LoadingService, useValue: mockLoadingService },
          { provide: HttpClient, useValue: mockHttpClient },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: MatDialog, useValue: mockDialog },
          { provide: PdfExportService, useValue: mockPdfExportService },
          { provide: NotificationService, useValue: mockNotificationService }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(HospitalDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load stats and doctors on init', () => {
    fixture.detectChanges();
    expect(mockHospitalService.getHospitalStats).toHaveBeenCalledWith(1);
    expect(mockHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/admin/doctors'), expect.any(Object));
    expect(component.stats()).toEqual(mockStats);
    expect(component.doctors()).toEqual(mockDoctors);
  });

  it('should compute percentages correctly', () => {
    fixture.detectChanges();
    expect(component.greenPercent()).toBe(60); // 12/20 * 100
    expect(component.yellowPercent()).toBe(25); // 5/20 * 100
    expect(component.redPercent()).toBe(15); // 3/20 * 100
    expect(component.criticalCount()).toBe(3);
  });

  it('should filter doctor performance list by zone load when chart onClick triggers', () => {
    fixture.detectChanges();
    
    // Simulate doughnut slice click for Yellow (Alta load = 50% to 80%)
    // Dr. House = 8/20 * 300% loadPercent = 120% (Critical)
    // Dr. Strange = 4/20 * 300% loadPercent = 60% (Alta)
    // Dr. Ted = 0 (Normal)
    if (component.pieChartOptions?.onClick) {
      component.pieChartOptions.onClick(new MouseEvent('click') as any, [{ index: 1 }] as any, null as any);
    }
    
    expect(component.selectedZoneFilter()).toBe('yellow');
    expect(component.filteredDoctorPerformance()).toEqual([mockStats.doctor_performance[1]]); // Dr. Strange only

    // Click again to toggle off
    if (component.pieChartOptions?.onClick) {
      component.pieChartOptions.onClick(new MouseEvent('click') as any, [{ index: 1 }] as any, null as any);
    }
    expect(component.selectedZoneFilter()).toBe('all');
    expect(component.filteredDoctorPerformance().length).toBe(3);
  });

  it('should filter doctor management list by search query and status', () => {
    fixture.detectChanges();
    
    // Test search filter
    component.doctorSearchQuery.set('Strange');
    expect(component.filteredDoctorsList()).toEqual([mockDoctors[1]]);
    
    // Reset search, test status filter
    component.doctorSearchQuery.set('');
    component.doctorStatusFilter.set('active');
    expect(component.filteredDoctorsList()).toEqual([mockDoctors[0], mockDoctors[2]]);
    
    component.doctorStatusFilter.set('inactive');
    expect(component.filteredDoctorsList()).toEqual([mockDoctors[1]]);
  });

  it('should open assign panel and load patients', () => {
    fixture.detectChanges();
    component.openAssignPanel(mockDoctors[0]);
    
    expect(component.selectedDoctorForAssign).toEqual(mockDoctors[0]);
    expect(component.showAssignPanel()).toBe(true);
    expect(mockHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/admin/patients'), expect.any(Object));
    expect(component.allPatients.length).toBe(2);
  });

  it('should assign doctor to patient, close panel and trigger local notification', () => {
    fixture.detectChanges();
    component.openAssignPanel(mockDoctors[0]);
    component.selectedPatientId = 50;
    
    component.assignPatient();
    
    expect(mockHttpClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/admin/patients/50/assign-doctor'),
      { doctor_id: 101 },
      expect.any(Object)
    );
    expect(mockSnackBar.open).toHaveBeenCalledWith('Paciente asignado correctamente', 'OK', { duration: 3000 });
    expect(mockNotificationService.sendLocalNotification).toHaveBeenCalledWith(
      '📋 Paciente Asignado',
      expect.objectContaining({ body: expect.stringContaining('Dr. House') })
    );
    expect(component.showAssignPanel()).toBe(false);
  });

  it('should toggle doctor active status and dispatch local notification', () => {
    fixture.detectChanges();
    const doc = { id: 101, full_name: 'Dr. House', is_active: true };
    component.toggleDoctorActive(doc);
    
    expect(mockHttpClient.patch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/doctors/101/deactivate'),
      {},
      expect.any(Object)
    );
    expect(doc.is_active).toBe(false);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Doctor desactivado', 'OK', { duration: 3000 });
    expect(mockNotificationService.sendLocalNotification).toHaveBeenCalledWith(
      '📴 Médico Desactivado',
      expect.objectContaining({ body: expect.stringContaining('Dr. House') })
    );
  });

  it('should compile HTML report and trigger exportFromHtml when downloadReport is called', async () => {
    fixture.detectChanges();
    
    await component.downloadReport();

    expect(mockPdfExportService.exportFromHtml).toHaveBeenCalledWith(
      expect.stringContaining('Hospital General Test'),
      expect.objectContaining({ paperSize: 'letter' })
    );
    expect(mockPdfExportService.exportFromHtml).toHaveBeenCalledWith(
      expect.stringContaining('Rendimiento y Asignación Médica'),
      expect.any(Object)
    );
  });
});
