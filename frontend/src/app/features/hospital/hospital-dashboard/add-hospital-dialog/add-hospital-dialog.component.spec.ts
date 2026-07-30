import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { AddHospitalDialogComponent } from './add-hospital-dialog.component';

describe('AddHospitalDialogComponent', () => {
  let component: AddHospitalDialogComponent;
  let fixture: ComponentFixture<AddHospitalDialogComponent>;

  const mockDialogRef = {
    close: vi.fn(),
  };

  const mockHttpClient = {
    post: vi.fn().mockReturnValue(of({ id: 1, name: 'Hospital Civil' })),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [
        AddHospitalDialogComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: HttpClient, useValue: mockHttpClient }
      ]
    })
    .overrideComponent(AddHospitalDialogComponent, {
      set: {
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: HttpClient, useValue: mockHttpClient }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddHospitalDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form controls empty', () => {
    fixture.detectChanges();
    const form = component.form;
    expect(form).toBeDefined();
    expect(form.get('name')?.value).toBe('');
    expect(form.get('state')?.value).toBe('');
  });

  it('should validate clues format correctly', () => {
    fixture.detectChanges();
    const cluesCtrl = component.form.get('clues');
    
    cluesCtrl?.setValue('INVALID');
    expect(cluesCtrl?.hasError('cluesFormat')).toBe(true);

    cluesCtrl?.setValue('DFSSA000001XX2'); // exactly 14 characters
    expect(cluesCtrl?.errors).toBeNull();
  });

  it('should validate phone pattern correctly', () => {
    fixture.detectChanges();
    const phoneCtrl = component.form.get('phone');
    
    phoneCtrl?.setValue('abc');
    expect(phoneCtrl?.hasError('pattern')).toBe(true);

    phoneCtrl?.setValue('+52 33 1234 5678');
    expect(phoneCtrl?.errors).toBeNull();
  });

  it('should call http.post on valid submit and close dialog', () => {
    fixture.detectChanges();
    component.form.patchValue({
      name: 'Hospital Civil de Guadalajara',
      institution_type: 'SSA',
      clues: 'DFSSA000001XX2',
      state: 'Jalisco',
      city: 'Guadalajara',
      address: 'Calle Falsa 123',
      phone: '3312345678'
    });

    expect(component.form.valid).toBe(true);
    component.onSubmit();

    expect(component.isSaving()).toBe(false);
    expect(mockHttpClient.post).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ id: 1, name: 'Hospital Civil' });
  });

  it('should handle API submit error and display message', () => {
    mockHttpClient.post.mockReturnValueOnce(throwError(() => ({
      error: { detail: 'Clave CLUES ya registrada' }
    })));
    fixture.detectChanges();

    component.form.patchValue({
      name: 'Hospital Civil de Guadalajara',
      institution_type: 'SSA',
      state: 'Jalisco',
      city: 'Guadalajara'
    });

    component.onSubmit();

    expect(component.isSaving()).toBe(false);
    expect(component.errorMsg()).toBe('Clave CLUES ya registrada');
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });
});
