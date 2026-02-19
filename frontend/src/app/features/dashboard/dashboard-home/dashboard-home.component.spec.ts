import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DashboardHomeComponent } from './dashboard-home.component';
import { PatientService } from '../../../core/services/patient.service';
import { AlertService } from '../../../core/services/alert.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { Router } from '@angular/router';

describe('DashboardHomeComponent', () => {
    let component: DashboardHomeComponent;
    let fixture: ComponentFixture<DashboardHomeComponent>;

    // Mock Services
    const mockPatientService = {
        getDashboardMetrics: () => of({
            totalPatients: 100,
            activePatients: 5,
            riskDistribution: [{ level: 'green', count: 80 }]
        }),
        getAllPatients: () => of([
            { id: 1, fullName: 'Test', riskLevel: 'red' },
            { id: 2, fullName: 'Test 2', riskLevel: 'green' }
        ])
    };

    const mockAlertService = {};
    const mockWsService = { disconnect: () => { } };
    const mockRouter = { navigate: () => { } };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                DashboardHomeComponent,
                NoopAnimationsModule,
                RouterTestingModule
            ],
            providers: [
                { provide: PatientService, useValue: mockPatientService },
                { provide: AlertService, useValue: mockAlertService },
                { provide: WebSocketService, useValue: mockWsService },
                { provide: Router, useValue: mockRouter },
                provideCharts(withDefaultRegisterables())
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DashboardHomeComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should stabilize view without NG0100 error', async () => {
        // Initial Trigger
        fixture.detectChanges();

        // Check initial loading state
        expect(component.isLoading).toBe(true);

        // Wait for component setTimeout(0) to fire (Universal delay)
        await new Promise(resolve => setTimeout(resolve, 100));

        // Detect changes again to update view with loaded data
        fixture.detectChanges();

        // Verify data loaded
        expect(component.isLoading).toBe(false);
        expect(component.kpis[0].value).toBe(100);
        expect(component.urgentPatients.length).toBe(1);

        // Verify View State
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('h1')?.textContent).toContain('Dashboard');
    });
});
