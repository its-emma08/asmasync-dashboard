import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService } from '../../../../core/services/patient.service';
import { MeasurementService } from '../../../../core/services/measurement.service';
import { Patient } from '../../../../core/models/patient.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-spirometer-simulator-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2 font-bold text-slate-800 dark:text-white text-base">
      <mat-icon class="text-indigo-600 dark:text-indigo-400">sensors</mat-icon>
      Simulador de Biosensor IoT (Soplido / Espirómetro)
    </h2>
    <mat-dialog-content class="!py-4">
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
        Esta herramienta simula la ingesta de telemetría de un espirómetro inteligente o biosensor IoT de oximetría. 
        Al enviar los datos, se calculará el nivel de riesgo con Machine Learning en tiempo real y se emitirá una alerta.
      </p>

      <form [formGroup]="form" class="flex flex-col gap-4">
        <!-- Seleccionar Paciente -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Seleccionar Paciente de Control</mat-label>
          <mat-select formControlName="email">
            <mat-option *ngFor="let patient of patients$ | async" [value]="patient.email">
              {{ patient.full_name }} ({{ patient.email }})
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('email')?.hasError('required')">Debe seleccionar un paciente</mat-error>
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
          <!-- PEF (Flujo Espiratorio Máximo) -->
          <mat-form-field appearance="outline">
            <mat-label>PEF (L/min)</mat-label>
            <input matInput type="number" formControlName="pef" placeholder="Ej: 350">
            <mat-hint class="text-[10px]">Normal: > 400 | Crisis: < 250</mat-hint>
            <mat-error *ngIf="form.get('pef')?.hasError('required')">Requerido</mat-error>
            <mat-error *ngIf="form.get('pef')?.hasError('min') || form.get('pef')?.hasError('max')">Rango: 1 - 900</mat-error>
          </mat-form-field>

          <!-- SpO2 (Saturación de Oxígeno) -->
          <mat-form-field appearance="outline">
            <mat-label>Saturación SpO2 (%)</mat-label>
            <input matInput type="number" formControlName="spo2" placeholder="Ej: 95">
            <mat-hint class="text-[10px]">Normal: >= 95 | Alerta: < 92</mat-hint>
            <mat-error *ngIf="form.get('spo2')?.hasError('required')">Requerido</mat-error>
            <mat-error *ngIf="form.get('spo2')?.hasError('min') || form.get('spo2')?.hasError('max')">Rango: 50 - 100</mat-error>
          </mat-form-field>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Síntomas -->
          <mat-form-field appearance="outline">
            <mat-label>Síntoma Principal</mat-label>
            <mat-select formControlName="symptom">
              <mat-option value="Ninguno">Ninguno</mat-option>
              <mat-option value="Tos seca o sibilancias">Tos o Sibilancias</mat-option>
              <mat-option value="Dificultad respiratoria">Dificultad Respiratoria</mat-option>
              <mat-option value="Opresión en el pecho">Opresión en el Pecho</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Intensidad del Síntoma -->
          <mat-form-field appearance="outline">
            <mat-label>Severidad del Síntoma</mat-label>
            <mat-select formControlName="symptom_intensity">
              <mat-option value="Ninguna">Ninguna</mat-option>
              <mat-option value="Leve">Leve</mat-option>
              <mat-option value="Moderada">Moderada</mat-option>
              <mat-option value="Grave">Grave</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Notas adicionales -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Notas de Simulación</mat-label>
          <textarea matInput formControlName="notes" rows="2" placeholder="Ej: Simulación de soplido matutino..."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2 !px-6 !pb-4">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" 
              [disabled]="form.invalid || isSubmitting" 
              (click)="simulate()">
        <span class="flex items-center gap-1.5">
          <mat-icon *ngIf="!isSubmitting" class="!text-sm">play_arrow</mat-icon>
          <mat-icon *ngIf="isSubmitting" class="animate-spin !text-sm">sync</mat-icon>
          Enviar Medición IoT
        </span>
      </button>
    </mat-dialog-actions>
  `
})
export class SpirometerSimulatorDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<SpirometerSimulatorDialogComponent>);
  private patientService = inject(PatientService);
  private measurementService = inject(MeasurementService);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  patients$!: Observable<Patient[]>;
  isSubmitting = false;

  ngOnInit(): void {
    this.patients$ = this.patientService.patients$;
    this.form = this.fb.group({
      email: ['', Validators.required],
      pef: [380, [Validators.required, Validators.min(1), Validators.max(900)]],
      spo2: [94, [Validators.required, Validators.min(50), Validators.max(100)]],
      symptom: ['Ninguno'],
      symptom_intensity: ['Ninguna'],
      notes: ['Lectura simulada del biosensor IoT']
    });
  }

  simulate(): void {
    if (this.form.invalid) return;

    this.isSubmitting = true;
    const val = this.form.value;

    const payload = {
      user_identifier: val.email,
      pef: val.pef,
      fev1: 3.0,
      symptoms: val.symptom === 'Ninguno' ? undefined : val.symptom,
      symptom_intensity: val.symptom_intensity === 'Ninguna' ? undefined : val.symptom_intensity,
      notes: val.notes || undefined,
      measured_at: new Date().toISOString()
    };

    this.measurementService.simulateReading(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.snackBar.open('Medición simulada exitosamente en el servidor Render.', 'Entendido', {
          duration: 4000,
          panelClass: 'glass-toast'
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.snackBar.open(`Error: ${err.message || 'La simulación falló.'}`, 'Cerrar', {
          duration: 5000
        });
      }
    });
  }
}
