import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-measurement-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        ReactiveFormsModule,
        MatIconModule
    ],
    template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon class="text-brand-cyan">add_circle</mat-icon>
      Nueva Medición
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 mt-2">
        
        <div class="grid grid-cols-2 gap-4">
            <mat-form-field appearance="outline" class="w-full">
            <mat-label>Tipo</mat-label>
            <mat-select formControlName="type">
                <mat-option value="pef">PEF (Flujo Espiratorio)</mat-option>
                <mat-option value="vitals">Signos Vitales</mat-option>
                <mat-option value="symptom">Síntoma</mat-option>
                <mat-option value="medication">Medicamento (Rescate)</mat-option>
                <mat-option value="checkup">Control Médico</mat-option>
            </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
            <mat-label>Fecha</mat-label>
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <input matInput [matDatepicker]="picker" formControlName="date">
            </mat-form-field>
        </div>

        <!-- Dynamic Fields based on Type -->
        <ng-container [ngSwitch]="form.get('type')?.value">
            
            <div *ngSwitchCase="'pef'" class="grid grid-cols-2 gap-4">
                <mat-form-field appearance="outline">
                    <mat-label>Valor (L/min)</mat-label>
                    <input matInput type="number" formControlName="pef" placeholder="Ej: 450">
                </mat-form-field>
                <div class="flex items-center text-sm text-gray-500">
                    <mat-icon class="scale-75 mr-1">info</mat-icon> Valor normal: >400
                </div>
                <!-- Error for PEF -->
                <mat-error *ngIf="form.get('pef')?.hasError('min') || form.get('pef')?.hasError('max')" class="col-span-2 text-xs">
                    El valor debe estar entre 1 y 900
                </mat-error>
            </div>

            <div *ngSwitchCase="'vitals'" class="grid grid-cols-2 gap-4">
                <mat-form-field appearance="outline">
                    <mat-label>SpO2 (%)</mat-label>
                    <input matInput type="number" formControlName="spo2" placeholder="Ej: 98">
                    <mat-error *ngIf="form.get('spo2')?.hasError('min') || form.get('spo2')?.hasError('max')">
                        Debe ser entre 50% y 100%
                    </mat-error>
                </mat-form-field>
                <mat-form-field appearance="outline">
                    <mat-label>Frecuencia Cardíaca (bpm)</mat-label>
                    <input matInput type="number" formControlName="heart_rate" placeholder="Ej: 70">
                    <mat-error *ngIf="form.get('heart_rate')?.hasError('min') || form.get('heart_rate')?.hasError('max')">
                        Debe ser entre 30 y 250 bpm
                    </mat-error>
                </mat-form-field>
            </div>

            <div *ngSwitchCase="'symptom'">
                <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Descripción del Síntoma</mat-label>
                    <input matInput formControlName="description" placeholder="Ej: Tos nocturna, sibilancias...">
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Severidad</mat-label>
                    <mat-select formControlName="severity">
                        <mat-option value="low">Leve</mat-option>
                        <mat-option value="medium">Moderado</mat-option>
                        <mat-option value="high">Grave</mat-option>
                    </mat-select>
                </mat-form-field>
            </div>

             <div *ngSwitchCase="'medication'">
                <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Medicamento</mat-label>
                    <input matInput formControlName="medicationName" placeholder="Ej: Salbutamol">
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Dosis / Puffs</mat-label>
                    <input matInput formControlName="dosage" placeholder="Ej: 2 puffs">
                </mat-form-field>
            </div>

        </ng-container>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Notas Adicionales</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">Guardar</button>
    </mat-dialog-actions>
  `
})
export class MeasurementDialogComponent {
    form: FormGroup;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<MeasurementDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.form = this.fb.group({
            type: ['pef', Validators.required],
            date: [new Date(), Validators.required],
            pef: [null, [Validators.min(1), Validators.max(900)]],
            spo2: [null, [Validators.min(50), Validators.max(100)]], // Added validators
            heart_rate: [null, [Validators.min(30), Validators.max(250)]], // Added validators
            description: [''],
            severity: ['low'],
            medicationName: [''],
            dosage: [''],
            notes: ['']
        });

        // Simple validator logic could go here
    }

    save() {
        if (this.form.valid) {
            const val = this.form.value;
            // Construct the record object
            const record = {
                type: val.type,
                date: val.date,
                notes: val.notes,
                // Spread specific fields
                ...(val.type === 'pef' && { pef: val.pef, description: `Medición PEF: ${val.pef} L/min` }),
                ...(val.type === 'vitals' && { spo2: val.spo2, heart_rate: val.heart_rate, description: `SpO2: ${val.spo2}%, FC: ${val.heart_rate} bpm` }),
                ...(val.type === 'symptom' && { description: val.description, severity: val.severity }),
                ...(val.type === 'medication' && { description: `Uso de ${val.medicationName} (${val.dosage})`, medication: val.medicationName, dosage: val.dosage }),
                ...(val.type === 'checkup' && { description: 'Control Médico Routine' })
            };

            this.dialogRef.close(record);
        }
    }
}
