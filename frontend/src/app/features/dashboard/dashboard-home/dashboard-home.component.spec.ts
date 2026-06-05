import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { DashboardHomeComponent } from './dashboard-home.component';
import { PatientService } from '../../../core/services/patient.service';
import { DashboardService } from '../services/dashboard.service';
import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WeatherService } from '../../../core/services/weather.service';

// ─── Minimal mocks — shape is all that matters here ──────────────────────────

const mockPatientService = {
  getDashboardMetrics: vi.fn().mockReturnValue(of({
    totalPatients: 10, activePatients: 5, riskDistribution: [], averagePef: 400,
  })),
  getAllPatients:      vi.fn().mockReturnValue(of([])),
  getPriorityPatients: vi.fn().mockReturnValue(of([])),
  getDoctorStats:     vi.fn().mockReturnValue(of({
    total_patients: 10, active_patients: 5, critical_count: 1, controlled_count: 8,
  })),
  resolveAlert: vi.fn().mockReturnValue(of(true)),
  // used by widget children — included so they don't throw if Angular resolves them
  patients$:     new BehaviorSubject([]),
  getPatients:   vi.fn().mockReturnValue(of({ data: [] })),
  getPatientStats: vi.fn().mockReturnValue(of({ total: 0, critical: 0, moderate: 0, stable: 0 })),
};

const mockDashboardService = {
  widgets$:        new BehaviorSubject([{ id: 'w1', type: 'kpi-group', size: 'full', title: 'KPI' }]),
  editMode$:       new BehaviorSubject(false),
  resetLayout:     vi.fn(),
  toggleEditMode:  vi.fn(),
  addWidget:       vi.fn(),
  removeWidget:    vi.fn(),
  updateWidgetSize: vi.fn(),
  reorderWidgets:  vi.fn(),
};

const mockAlertService = {
  // Signal<AsthmaZone> — must be a real signal so effect() can track it
  healthStatus:       signal<'Green' | 'Yellow' | 'Red'>('Green'),
  updateHealthStatus: vi.fn(),
};

const mockAuthService = {
  currentUserValue: { id: 1, full_name: 'Dr. Test' },
  logout:           vi.fn(),
  getToken:         vi.fn().mockReturnValue('test-token'),
};

const mockLoadingService = {
  updateProgress: vi.fn(),
  hideLoading:    vi.fn(),
  showLoading:    vi.fn(),
};

const mockNotificationService = {
  requestPermission:     vi.fn().mockResolvedValue(undefined),
  triggerCriticalAlert:  vi.fn(),
  notifications$:        of([]),
  unreadCount$:          of(0),
};

const mockWeatherService = {
  currentWeather: signal<any>(null),
};

const mockSnackBar = { open: vi.fn() };
const mockDialog   = {
  open: vi.fn().mockReturnValue({ afterClosed: () => of(null) }),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('DashboardHomeComponent', () => {
  let component: DashboardHomeComponent;
  let fixture: ComponentFixture<DashboardHomeComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [DashboardHomeComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideCharts(withDefaultRegisterables()),
        { provide: PatientService,       useValue: mockPatientService       },
        { provide: DashboardService,     useValue: mockDashboardService     },
        { provide: AlertService,         useValue: mockAlertService         },
        { provide: AuthService,          useValue: mockAuthService          },
        { provide: LoadingService,       useValue: mockLoadingService       },
        { provide: NotificationService,  useValue: mockNotificationService  },
        { provide: WeatherService,       useValue: mockWeatherService       },
        { provide: MatSnackBar,          useValue: mockSnackBar             },
        { provide: MatDialog,            useValue: mockDialog               },
      ],
    })
    // Strip the heavy widget imports so their transitive deps don't need providers.
    // CUSTOM_ELEMENTS_SCHEMA on the override suppresses unknown-element errors in
    // the original template, which still references those widget selectors.
    .overrideComponent(DashboardHomeComponent, {
      set: { template: '<div data-testid="dashboard-stub"></div>', imports: [] },
    })
    .compileComponents();

    fixture   = TestBed.createComponent(DashboardHomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize without throwing and finish loading', async () => {
    fixture.detectChanges();       // triggers ngOnInit → loadDashboardData()
    await fixture.whenStable();    // waits for synchronous of() observables to settle
    expect(component.isLoading).toBe(false);
  });

  // ── Future coverage (out of scope for this cleanup pass) ──────────────────
  it.todo('markAsResolved() rolls back urgentPatients on API error');
  it.todo('markAllAsResolved() calls markAsResolved for each urgent patient');
  it.todo('drop() delegates reorder to DashboardService');
  it.todo('effect triggers emergency dialog when healthStatus turns Red');
});
