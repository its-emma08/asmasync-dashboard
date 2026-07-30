import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-edit-doctor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './edit-doctor-dialog.component.html',
  styleUrls: ['./edit-doctor-dialog.component.scss']
})
export class EditDoctorDialogComponent {
  form: FormGroup;
  saving = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<EditDoctorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public doctor: any
  ) {
    this.form = this.fb.group({
      full_name:      [doctor.full_name      || '', [Validators.required, Validators.minLength(3)]],
      specialty:      [doctor.specialty      || ''],
      license_number: [doctor.license_number || '', [Validators.pattern(/^\d{7,8}$/)]],
      hospital_name:  [doctor.hospital_name  || '']
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.error = '';

    const v = this.form.value;
    const payload: Record<string, string> = {};
    if (v.full_name?.trim())      payload['full_name']      = v.full_name.trim();
    if (v.specialty?.trim())      payload['specialty']      = v.specialty.trim();
    if (v.license_number?.trim()) payload['license_number'] = v.license_number.trim();
    if (v.hospital_name?.trim())  payload['hospital_name']  = v.hospital_name.trim();

    this.http.patch(`${environment.apiUrl}/admin/doctors/${this.doctor.id}`, payload, {
      headers: { 'X-Dashboard-Api-Key': environment.dashboardApiKey }
    }).pipe(
      catchError(err => {
        this.error = err?.error?.detail || 'Error al guardar los cambios.';
        this.saving = false;
        return of(null);
      })
    ).subscribe(res => {
      this.saving = false;
      if (res !== null) {
        this.dialogRef.close({ ...this.doctor, ...payload });
      }
    });
  }

  cancel(): void { this.dialogRef.close(null); }
}
