import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { EditDoctorDialogComponent } from './edit-doctor-dialog.component';

describe('EditDoctorDialogComponent', () => {
  let component: EditDoctorDialogComponent;
  let fixture: ComponentFixture<EditDoctorDialogComponent>;

  const mockDoctorData = {
    id: 99,
    full_name: 'Dr. Gregory House',
    specialty: 'Diagnostic Medicine',
    license_number: '1234567',
    hospital_name: 'Princeton Plainsboro',
    email: 'house@plainsboro.com'
  };

  const mockDialogRef = {
    close: vi.fn(),
  };

  const mockHttpClient = {
    patch: vi.fn().mockReturnValue(of({ success: true })),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [
        EditDoctorDialogComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: MAT_DIALOG_DATA, useValue: mockDoctorData }
      ]
    })
    .overrideComponent(EditDoctorDialogComponent, {
      set: {
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: HttpClient, useValue: mockHttpClient },
          { provide: MAT_DIALOG_DATA, useValue: mockDoctorData }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditDoctorDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with doctor data', () => {
    fixture.detectChanges();
    const form = component.form;
    expect(form).toBeDefined();
    expect(form.get('full_name')?.value).toBe('Dr. Gregory House');
    expect(form.get('specialty')?.value).toBe('Diagnostic Medicine');
    expect(form.get('license_number')?.value).toBe('1234567');
  });

  it('should validate license number format', () => {
    fixture.detectChanges();
    const licenseCtrl = component.form.get('license_number');

    licenseCtrl?.setValue('12345'); // too short (needs 7 or 8)
    expect(licenseCtrl?.hasError('pattern')).toBe(true);

    licenseCtrl?.setValue('123456789'); // too long
    expect(licenseCtrl?.hasError('pattern')).toBe(true);

    licenseCtrl?.setValue('12345678'); // exactly 8 digits
    expect(licenseCtrl?.errors).toBeNull();
  });

  it('should submit successfully patch request and close dialog', () => {
    fixture.detectChanges();
    component.form.patchValue({
      full_name: 'Dr. Gregory House Modified',
      license_number: '77777777'
    });

    component.save();

    expect(component.saving).toBe(false);
    expect(mockHttpClient.patch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/doctors/99'),
      expect.objectContaining({
        full_name: 'Dr. Gregory House Modified',
        license_number: '77777777'
      }),
      expect.any(Object)
    );
    expect(mockDialogRef.close).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 99,
        full_name: 'Dr. Gregory House Modified',
        license_number: '77777777'
      })
    );
  });

  it('should display error message on API patch failure', () => {
    mockHttpClient.patch.mockReturnValueOnce(throwError(() => ({
      error: { detail: 'Cédula profesional duplicada' }
    })));
    fixture.detectChanges();

    component.save();

    expect(component.saving).toBe(false);
    expect(component.error).toBe('Cédula profesional duplicada');
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should close dialog with null on cancel', () => {
    fixture.detectChanges();
    component.cancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });
});
