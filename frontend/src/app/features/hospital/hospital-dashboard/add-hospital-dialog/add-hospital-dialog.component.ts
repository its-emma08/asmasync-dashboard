import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../../../environments/environment';

/** Validador de CLUES: 14 chars alfanuméricos */
function cluesValidator(ctrl: AbstractControl): { [key: string]: boolean } | null {
  if (!ctrl.value) return null;
  return /^[A-Z0-9]{14}$/i.test(ctrl.value) ? null : { cluesFormat: true };
}

@Component({
  selector: 'app-add-hospital-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-hospital-dialog.component.html',
  styleUrls: ['./add-hospital-dialog.component.scss'],
})
export class AddHospitalDialogComponent {
  form: FormGroup;
  isSaving = signal(false);
  errorMsg = signal('');

  readonly states = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
    'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango',
    'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán',
    'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro',
    'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco',
    'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
  ];

  readonly institutionTypes = [
    { value: 'IMSS',    label: 'IMSS' },
    { value: 'ISSSTE',  label: 'ISSSTE' },
    { value: 'SSA',     label: 'Secretaría de Salud (SSA)' },
    { value: 'PEMEX',   label: 'PEMEX' },
    { value: 'SEDENA',  label: 'SEDENA' },
    { value: 'SEMAR',   label: 'SEMAR' },
    { value: 'PRIVADA', label: 'Privada' },
    { value: 'OTRO',    label: 'Otro' },
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddHospitalDialogComponent>,
    private http: HttpClient,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(120)]],
      institution_type: ['', Validators.required],
      clues: ['', [cluesValidator]],
      state: ['', Validators.required],
      city: ['', [Validators.required, Validators.maxLength(80)]],
      address: ['', Validators.maxLength(200)],
      phone: ['', [Validators.pattern(/^[\d\-\s\(\)\+]{7,20}$/)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMsg.set('');

    const raw = this.form.value;
    const payload: Record<string, unknown> = {
      name: raw.name.trim(),
      institution_type: raw.institution_type,
      state: raw.state,
      city: raw.city.trim(),
    };
    if (raw.clues?.trim())    payload['clues']    = raw.clues.trim().toUpperCase();
    if (raw.address?.trim())  payload['address']  = raw.address.trim();
    if (raw.phone?.trim())    payload['phone']    = raw.phone.trim();

    const token = localStorage.getItem('access_token') ?? '';
    this.http
      .post(`${environment.apiUrl}/hospitals`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        catchError(err => {
          const detail = err?.error?.detail ?? 'Error al registrar el hospital. Verifica los datos e intenta de nuevo.';
          this.errorMsg.set(detail);
          this.isSaving.set(false);
          return of(null);
        }),
      )
      .subscribe(res => {
        if (res !== null) {
          this.isSaving.set(false);
          this.dialogRef.close(res);
        }
      });
  }
}
