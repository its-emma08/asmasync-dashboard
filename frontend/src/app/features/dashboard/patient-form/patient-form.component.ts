import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { PatientService } from '../../../core/services/patient.service';

import { MatDialog } from '@angular/material/dialog';
import { SuccessModalComponent } from '../../../shared/components/success-modal/success-modal.component';
import { ToastService } from '../../../shared/services/toast.service';
import { FocusInvalidInputDirective } from '../../../shared/directives/focus-invalid-input.directive';
import { ComponentCanDeactivate } from '../../../core/guards/pending-changes.guard';

@Component({
    selector: 'app-patient-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatDividerModule,
        MatSelectModule,
        MatIconModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatStepperModule,
        FocusInvalidInputDirective
    ],
    templateUrl: './patient-form.component.html',
    styleUrls: ['./patient-form.component.scss']
})
export class PatientFormComponent implements OnInit, ComponentCanDeactivate {
    form: FormGroup;
    identityGroup!: FormGroup;
    clinicalGroup!: FormGroup;
    isLoading = false;
    isEditMode = false;
    patientId: string | null = null;
    photoPreview: string | null = null; // Photo preview URL

    // Custom Validator for Date of Birth
    dateValidator(control: any): { [key: string]: boolean } | null {
        if (!control.value) return null;
        const date = new Date(control.value);
        const today = new Date();
        const minDate = new Date();
        minDate.setFullYear(today.getFullYear() - 120); // Max 120 years old

        if (date > today) {
            return { 'futureDate': true };
        }
        if (date < minDate) {
            return { 'tooOld': true };
        }
        return null;
    }

    constructor(
        private fb: FormBuilder,
        private patientService: PatientService,
        private router: Router,
        private route: ActivatedRoute,
        private snackBar: MatSnackBar,
        private cd: ChangeDetectorRef,
        private dialog: MatDialog,
        private toastService: ToastService
    ) {
        this.form = this.fb.group({
            // Datos Personales
            full_name: ['', [Validators.required, Validators.minLength(3)]],
            date_of_birth: ['', [Validators.required, this.dateValidator]],
            gender: ['male', Validators.required],
            weight: [null, [Validators.required, Validators.min(1), Validators.max(300)]],
            height: [null, [Validators.required, Validators.min(30), Validators.max(250)]],
            // Contacto
            email: ['', [Validators.email]], // Optional but strictly formatted if present
            phone: ['', [Validators.pattern(/^\d{10}$/)]],
            emergency_contact_name: [''],
            emergency_contact_phone: ['', [Validators.pattern(/^\d{10}$/)]],
            emergency_contact_relation: [''],
            // Datos Clínicos
            asthma_type: ['allergic', Validators.required],
            diagnosis_date: ['', this.dateValidator], // Also validate this
            personal_best_pef: [500, [Validators.required, Validators.min(50), Validators.max(900)]],
            blood_type: [''],
            allergies: [''],
            current_medications: [''],
            // Family History
            family_history_mother: [''],
            family_history_father: [''],
            family_history_siblings: [''],
            family_history_grandparents: [''],
            // Personal Non-Pathological History
            smoking: [''],
            alcohol: [''],
            exercise: [''],
            diet: [''],
            // Personal Pathological History
            surgeries_traumas: [''],
            // Photo
            photo_url: [''],
            // Devices
            spirometer_id: [''],
            inhaler_id: ['']
        });

        // Step form groups for linear stepper validation
        this.identityGroup = this.fb.group({
            full_name: this.form.get('full_name')!,
            date_of_birth: this.form.get('date_of_birth')!,
            gender: this.form.get('gender')!,
            weight: this.form.get('weight')!,
            height: this.form.get('height')!
        });
        this.clinicalGroup = this.fb.group({
            asthma_type: this.form.get('asthma_type')!,
            personal_best_pef: this.form.get('personal_best_pef')!
        });
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.patientId = params['id'];
                this.loadPatient(params['id']);
            }
        });
    }

    loadPatient(id: string) {
        this.isLoading = true;
        this.patientService.getPatientById(id).subscribe({
            next: (p) => {
                this.isLoading = false;
                if (p) {
                    this.form.patchValue({
                        full_name: p.full_name,
                        date_of_birth: p.date_of_birth,
                        gender: p.gender,
                        weight: p.weight_kg || (p as any).weight || null,
                        height: p.height_cm || (p as any).height || null,
                        email: p.email,
                        phone: p.phone || '',
                        emergency_contact_name: p.emergencyContact?.name || (p as any).emergency_contact_name || '',
                        emergency_contact_phone: p.emergencyContact?.phone || (p as any).emergency_contact_phone || '',
                        emergency_contact_relation: p.emergencyContact?.relation || (p as any).emergency_contact_relation || '',
                        asthma_type: p.asthma_type,
                        diagnosis_date: p.diagnosisDate || (p as any).diagnosis_date || '',
                        personal_best_pef: p.personal_best_pef
                    });
                    this.cd.detectChanges();
                }
            },
            error: () => {
                this.isLoading = false;
                this.snackBar.open('No pudimos cargar la información del paciente. Por favor, intenta de nuevo.', 'Cerrar');
                this.router.navigate(['/dashboard/patients']);
            }
        });
    }

    onSubmit() {
        if (this.form.valid) {
            this.isLoading = true;
            this.cd.detectChanges();
            const formVal = this.form.value;

            // Prepare data
            const patientData = {
                ...formVal,
                latest_pef: this.isEditMode ? formVal.latest_pef : 0,
                riskLevel: this.isEditMode ? formVal.riskLevel : 'green',
                adherence: this.isEditMode ? formVal.adherence : 100
            };

            const request$ = (this.isEditMode && this.patientId)
                ? this.patientService.updatePatient(this.patientId, formVal)
                : this.patientService.addPatient(patientData);

            request$.subscribe({
                next: () => {
                    this.isLoading = false;

                    // Open Success Modal
                    const dialogRef = this.dialog.open(SuccessModalComponent, {
                        panelClass: 'success-modal-panel',
                        disableClose: true,
                        data: {
                            title: this.isEditMode ? '¡Actualizado!' : '¡Paciente Guardado!',
                            message: this.isEditMode
                                ? 'La información del paciente ha sido actualizada correctamente.'
                                : 'El nuevo paciente ha sido registrado en el sistema con éxito.',
                            buttonText: 'Continuar'
                        }
                    });

                    // Auto-close and navigate after 2 seconds
                    setTimeout(() => {
                        dialogRef.close();
                        const targetUrl = (this.isEditMode && this.patientId)
                            ? ['/dashboard/patients', this.patientId]
                            : ['/dashboard/patients'];
                        this.router.navigate(targetUrl);
                    }, 2000);
                },
                error: (e: any) => this.handleError(e)
            });
        } else {
            this.toastService.show('Por favor, revisa los errores en el formulario', 'error');
            this.form.markAllAsTouched();
        }
    }

    private handleError(e: any) {
        console.error(e);
        this.isLoading = false;
        this.snackBar.open('No pudimos guardar los cambios. Revisa tu conexión.', 'Cerrar');
    }



    onPhotoSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Validate file size (2MB max)
            if (file.size > 2 * 1024 * 1024) {
                this.snackBar.open('La imagen no puede superar 2MB', 'Cerrar', { duration: 3000 });
                return;
            }

            // Validate file type
            if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
                this.snackBar.open('Solo se permiten imágenes JPG, JPEG o PNG', 'Cerrar', { duration: 3000 });
                return;
            }

            // Create preview
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                // Fix NG0100: Update asynchronously
                setTimeout(() => {
                    this.photoPreview = e.target?.result as string;
                    this.form.patchValue({ photo_url: this.photoPreview });
                    this.cd.detectChanges();
                }, 0);
            };
            reader.readAsDataURL(file);
        }
    }

    removePhoto(): void {
        this.photoPreview = null;
        this.form.patchValue({ photo_url: '' });
    }

    canDeactivate(): boolean {
        // If form is dirty and not submitted, confirm exit
        if (this.form.dirty && !this.isLoading) {
            return confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?');
        }
        return true;
    }
}

