import { Component, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PatientService } from '../../../../core/services/patient.service';

@Component({
  selector: 'app-clinical-history-stepper',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './clinical-history-stepper.component.html',
  styleUrls: ['./clinical-history-stepper.component.scss']
})
export class ClinicalHistoryStepperComponent implements OnInit {
  @Input() patientId!: number | string;
  @Input() initialData: any = {};

  historyForm!: FormGroup;
  isSaving = signal(false);

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const data = this.initialData || {};
    
    this.historyForm = this.fb.group({
      // Step 1: Patológicos y Familiares
      family_history: [data.family_history || ''],
      hereditary_diseases: this.fb.group({
        diabetes: [data.hereditary_diseases?.diabetes || false],
        asthma: [data.hereditary_diseases?.asthma || false],
        hypertension: [data.hereditary_diseases?.hypertension || false],
      }),
      surgeries_history: [data.surgeries_history || ''],
      
      // Step 2: Vivienda y Zoonosis
      housing_conditions: this.fb.group({
        type: [data.housing_conditions?.type || 'urban'],
        pets: [data.housing_conditions?.pets || []],
        dampness: [data.housing_conditions?.dampness || false],
        carpets: [data.housing_conditions?.carpets || false]
      }),
      
      // Step 3: Higiene y Riesgos
      smoking: [data.smoking || 'never'],
      alcohol_consumption: [data.alcohol_consumption || 'no'],
      physical_activity: [data.physical_activity || 'sedentary']
    });
  }

  onSubmit(): void {
    if (this.historyForm.invalid) return;

    this.isSaving.set(true);
    this.patientService.updateClinicalHistory(this.patientId, this.historyForm.value).subscribe({
      next: () => {
        this.snackBar.open('Historial clínico actualizado con éxito', 'Cerrar', { duration: 3000 });
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Error updating clinical history', err);
        this.snackBar.open('Error al actualizar el historial', 'Cerrar', { duration: 3000 });
        this.isSaving.set(false);
      }
    });
  }
}
