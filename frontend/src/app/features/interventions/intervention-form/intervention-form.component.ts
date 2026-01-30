import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { InterventionService } from '../../../core/services/intervention.service';
import { PatientService } from '../../../core/services/patient.service';
import { AuthService } from '../../../core/services/auth.service';
import { InterventionSuccessDialogComponent } from '../intervention-success-dialog/intervention-success-dialog.component';
import { Patient } from '../../../core/models/patient.model';

@Component({
    selector: 'app-intervention-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSnackBarModule,
        MatCardModule,
        MatIconModule,
        MatDialogModule
    ],
    templateUrl: './intervention-form.component.html',
    styleUrls: ['./intervention-form.component.scss']
})
export class InterventionFormComponent implements OnInit {
    interventionForm: FormGroup;
    patients: Patient[] = [];
    loading = false;
    minDate: Date = new Date();

    interventionTypes = [
        { value: 'phone_counseling', label: 'Consejería telefónica' },
        { value: 'action_plan_adjustment', label: 'Ajuste de plan de acción' },
        { value: 'educational_reinforcement', label: 'Refuerzo educativo' },
        { value: 'inhaler_technique_review', label: 'Revisión técnica de nuevo inhalador' },
        { value: 'other', label: 'Otro' }
    ];

    constructor(
        private fb: FormBuilder,
        private interventionService: InterventionService,
        private patientService: PatientService,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {
        this.interventionForm = this.fb.group({
            patientId: ['', Validators.required],
            type: ['', Validators.required],
            description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
            recommendations: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(300)]],
            nextFollowUp: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.loadPatients();

        // Check for patient ID in query params to pre-select
        this.route.queryParams.subscribe(params => {
            if (params['patientId']) {
                this.interventionForm.patchValue({ patientId: +params['patientId'] });
            }
        });

        // Default next follow up to 7 days from now
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        this.interventionForm.patchValue({ nextFollowUp: nextWeek });
    }

    loadPatients(): void {
        this.patientService.getAllPatients().subscribe({
            next: (data) => this.patients = data,
            error: (err) => console.error('Failed to load patients', err)
        });
    }

    onSubmit(): void {
        if (this.interventionForm.valid) {
            this.loading = true;
            this.authService.getCurrentUser().pipe(take(1)).subscribe(currentUser => {
                const interventionData = {
                    ...this.interventionForm.value,
                    nurseId: currentUser ? currentUser.id : 0,
                    createdAt: new Date()
                };

                this.interventionService.createIntervention(interventionData).subscribe({
                    next: (response) => {
                        this.loading = false;
                        this.openSuccessDialog(response);
                    },
                    error: (err) => {
                        this.loading = false;
                        console.error(err);
                        this.snackBar.open('Error al guardar la intervención', 'Cerrar', { duration: 3000 });
                    }
                });
            });
        }
    }

    openSuccessDialog(savedIntervention: any): void {
        const dialogRef = this.dialog.open(InterventionSuccessDialogComponent, {
            width: '450px',
            disableClose: true,
            data: { intervention: savedIntervention }
        });

        dialogRef.afterClosed().subscribe(action => {
            if (action === 'view-patient') {
                this.router.navigate(['/dashboard/patients', savedIntervention.patientId]);
            } else if (action === 'new') {
                this.resetForm();
            } else {
                this.router.navigate(['/dashboard']);
            }
        });
    }

    resetForm(): void {
        this.interventionForm.reset();
        // Restore default date
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        this.interventionForm.patchValue({ nextFollowUp: nextWeek });
        // Clear errors
        Object.keys(this.interventionForm.controls).forEach(key => {
            this.interventionForm.get(key)?.setErrors(null);
        });
    }

    cancel(): void {
        this.router.navigate(['/dashboard']);
    }
}
