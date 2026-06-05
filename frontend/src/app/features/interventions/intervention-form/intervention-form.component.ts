import { Component, OnInit, OnDestroy, Optional, Inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
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
import { InterventionSuccessDialogComponent } from '../intervention-success-dialog/intervention-success-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Patient } from '../../../core/models/patient.model';
import { Observable, Subject, takeUntil } from 'rxjs';

import { ComponentCanDeactivate } from '../../../core/guards/pending-changes.guard';

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
export class InterventionFormComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
    private destroy$ = new Subject<void>();

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
        private router: Router,
        private route: ActivatedRoute,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        @Optional() public dialogRef: MatDialogRef<InterventionFormComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: { patientId: number }
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

        // Check dialog data first
        if (this.data && this.data.patientId) {
            this.interventionForm.patchValue({ patientId: this.data.patientId });
        }

        // Then check query params
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
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
            const v = this.interventionForm.value;
            const payload = {
                patient_id: v.patientId,
                type: v.type,
                description: v.description,
                recommendations: v.recommendations || null,
                next_follow_up: v.nextFollowUp
                    ? new Date(v.nextFollowUp).toISOString().split('T')[0]
                    : null,
            };

            this.interventionService.create(payload).subscribe({
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
        }
    }

    openSuccessDialog(savedIntervention: any): void {
        // If we are in a dialog, close it and return result
        if (this.dialogRef) {
            this.dialogRef.close('saved');
            this.snackBar.open('Intervención guardada correctamente', 'Cerrar', { duration: 3000 });
            return;
        }

        const dialogRef = this.dialog.open(InterventionSuccessDialogComponent, {
            width: '450px',
            disableClose: true,
            data: { intervention: savedIntervention }
        });

        dialogRef.afterClosed().subscribe(action => {
            if (action === 'view-patient') {
                this.router.navigate(['/dashboard/patients', savedIntervention.patient_id]);
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
        if (this.dialogRef) {
            this.dialogRef.close();
        } else {
            this.router.navigate(['/dashboard']);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    canDeactivate(): boolean | Observable<boolean> {
        if (this.interventionForm.dirty && !this.loading) {
            return this.dialog.open(ConfirmDialogComponent, {
                width: '380px',
                data: {
                    title: 'Cambios sin guardar',
                    message: 'Tienes cambios sin guardar en la intervención. ¿Estás seguro de que quieres salir?',
                    confirmText: 'Salir sin guardar',
                    cancelText: 'Seguir editando',
                    isDestructive: true
                }
            }).afterClosed();
        }
        return true;
    }
}

