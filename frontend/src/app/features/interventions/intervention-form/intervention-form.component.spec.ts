import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { InterventionFormComponent } from './intervention-form.component';
import { InterventionService } from '../../../core/services/intervention.service';
import { PatientService } from '../../../core/services/patient.service';

describe('InterventionFormComponent', () => {
  let component: InterventionFormComponent;
  let fixture: ComponentFixture<InterventionFormComponent>;

  const mockRouter = {
    navigate: vi.fn(),
  };

  const mockActivatedRoute = {
    queryParams: of({ patientId: '12' }),
  };

  const mockInterventionService = {
    create: vi.fn().mockReturnValue(of({ id: 100, patient_id: 12, type: 'phone_counseling' })),
  };

  const mockPatientService = {
    getAllPatients: vi.fn().mockReturnValue(of([
      { id: 12, full_name: 'Juan Perez', email: 'juan@test.com' },
      { id: 15, full_name: 'Maria Gomez', email: 'maria@test.com' }
    ])),
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  const mockDialogRef = {
    close: vi.fn(),
    afterClosed: vi.fn().mockReturnValue(of('new')),
  };

  const mockDialog = {
    open: vi.fn().mockReturnValue(mockDialogRef),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [
        InterventionFormComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: InterventionService, useValue: mockInterventionService },
        { provide: PatientService, useValue: mockPatientService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatDialogRef, useValue: null },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    })
    .overrideComponent(InterventionFormComponent, {
      set: {
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          { provide: InterventionService, useValue: mockInterventionService },
          { provide: PatientService, useValue: mockPatientService },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: MatDialog, useValue: mockDialog },
          { provide: MatDialogRef, useValue: null },
          { provide: MAT_DIALOG_DATA, useValue: null }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterventionFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form controls and default nextFollowUp', () => {
    fixture.detectChanges();
    expect(component.interventionForm).toBeDefined();
    expect(component.interventionForm.get('patientId')?.value).toBe(12); // from query params
    expect(component.interventionForm.get('nextFollowUp')?.value).toBeInstanceOf(Date);
  });

  it('should load patients on init', () => {
    fixture.detectChanges();
    expect(mockPatientService.getAllPatients).toHaveBeenCalled();
    expect(component.patients.length).toBe(2);
    expect(component.patients[0].full_name).toBe('Juan Perez');
  });

  it('should mark form as invalid when fields are empty or short', () => {
    fixture.detectChanges();
    const form = component.interventionForm;
    
    form.patchValue({
      description: 'short',
      recommendations: 'short',
    });
    
    expect(form.valid).toBeFalsy();
    expect(form.get('description')?.hasError('minlength')).toBeTruthy();
  });

  it('should submit successfully and open success dialog', () => {
    fixture.detectChanges();
    const form = component.interventionForm;
    
    form.patchValue({
      patientId: 12,
      type: 'phone_counseling',
      description: 'Esta es una descripcion con mas de veinte caracteres obligatorios para validar.',
      recommendations: 'Recomendaciones validas de mas de diez letras',
      nextFollowUp: new Date(),
    });
    
    expect(form.valid).toBeTruthy();
    
    component.onSubmit();
    
    expect(component.loading).toBeFalsy();
    expect(mockInterventionService.create).toHaveBeenCalled();
    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should handle submission error with snackbar', () => {
    mockInterventionService.create.mockReturnValueOnce(throwError(() => new Error('API Error')));
    fixture.detectChanges();
    
    const form = component.interventionForm;
    form.patchValue({
      patientId: 12,
      type: 'phone_counseling',
      description: 'Esta es una descripcion con mas de veinte caracteres obligatorios para validar.',
      recommendations: 'Recomendaciones validas de mas de diez letras',
      nextFollowUp: new Date(),
    });
    
    component.onSubmit();
    
    expect(component.loading).toBeFalsy();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Error al guardar la intervención', 'Cerrar', { duration: 3000 });
  });

  it('should cancel and navigate to dashboard', () => {
    fixture.detectChanges();
    component.cancel();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
