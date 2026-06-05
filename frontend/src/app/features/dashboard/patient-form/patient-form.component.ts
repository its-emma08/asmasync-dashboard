import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { PatientService } from '../../../core/services/patient.service';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';

import { MatDialog } from '@angular/material/dialog';
import { SuccessModalComponent } from '../../../shared/components/success-modal/success-modal.component';
import { ToastService } from '../../../shared/services/toast.service';
import { ComponentCanDeactivate } from '../../../core/guards/pending-changes.guard';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { firstValueFrom, Subject, Observable, takeUntil, timer, switchMap, of } from 'rxjs';
import { HostListener } from '@angular/core';
import { FocusInvalidInputDirective } from '../../../shared/directives/focus-invalid-input.directive';

@Component({
    selector: 'app-patient-form',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
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
        MatTabsModule,
        MatDatepickerModule,
        MatNativeDateModule,
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
    photoPreview: string | null = null;
    isLoading$: Observable<boolean> | undefined;
    selectedTabIndex = 0;
    readonly TAB_COUNT = 2;
    private destroy$ = new Subject<void>();
    private hasManualChanges = false;

    @HostListener('input')
    @HostListener('change')
    onFormChange() {
        this.hasManualChanges = true;
    }

    emailExistsValidator(): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {
            if (!control.value || control.hasError('email')) {
                this.emailAlreadyRegistered = false;
                this.prefillApplied = false;
                return of(null);
            }
            return timer(600).pipe(
                switchMap(() => this.patientService.checkEmailExists(control.value)),
                switchMap(res => {
                    this.emailAlreadyRegistered = res.exists;
                    if (res.exists && res.patient && !this.prefillApplied) {
                        this.prefillApplied = true;
                        this.applyPatientPrefill(res.patient);
                    }
                    if (!res.exists) {
                        this.prefillApplied = false;
                    }
                    return [null] as (ValidationErrors | null)[];
                })
            );
        };
    }

    private applyPatientPrefill(p: any): void {
        const patch: Record<string, any> = {};
        if (p.full_name)           patch['full_name']           = p.full_name;
        if (p.date_of_birth)       patch['date_of_birth']       = p.date_of_birth;
        if (p.gender)              patch['gender']              = p.gender;
        if (p.weight != null)      patch['weight']              = p.weight;
        if (p.height != null)      patch['height']              = p.height;
        if (p.phone)               patch['phone']               = p.phone;
        if (p.blood_type)          patch['blood_type']          = p.blood_type;
        if (p.asthma_type)         patch['asthma_type']         = p.asthma_type;
        if (p.personal_best_pef)   patch['personal_best_pef']   = p.personal_best_pef;
        if (p.allergies)           patch['allergies']           = p.allergies;
        if (p.current_medications) patch['current_medications'] = p.current_medications;
        if (p.family_history_mother)       patch['family_history_mother']       = p.family_history_mother;
        if (p.family_history_father)       patch['family_history_father']       = p.family_history_father;
        if (p.family_history_siblings)     patch['family_history_siblings']     = p.family_history_siblings;
        if (p.family_history_grandparents) patch['family_history_grandparents'] = p.family_history_grandparents;
        if (p.smoking)   patch['smoking']   = p.smoking;
        if (p.alcohol)   patch['alcohol']   = p.alcohol;
        if (p.exercise)  patch['exercise']  = p.exercise;
        if (p.diet)      patch['diet']      = p.diet;
        if (p.surgeries_traumas) patch['surgeries_traumas'] = p.surgeries_traumas;
        if (Object.keys(patch).length > 0) {
            this.form.patchValue(patch, { emitEvent: false });
            this.cd.markForCheck();
        }
    }

    emailAlreadyRegistered = false;
    prefillApplied = false;

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
            gender: ['', Validators.required],
            weight: [null, [Validators.required, Validators.min(1), Validators.max(300)]],
            height: [null, [Validators.required, Validators.min(30), Validators.max(250)]],
            // Contacto
            email: ['', [Validators.email]], // Optional but strictly formatted if present
            phone: ['', [Validators.pattern(/^\d{10}$/)]],
            emergency_contact_name: [''],
            emergency_contact_phone: ['', [Validators.pattern(/^\d{10}$/)]],
            emergency_contact_relation: [''],
            // Datos Clínicos
            asthma_type: ['', Validators.required],
            diagnosis_date: ['', this.dateValidator], // Also validate this
            personal_best_pef: [null, [Validators.required, Validators.min(50), Validators.max(900)]],
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
            height: this.form.get('height')!,
            email: this.form.get('email')!,
            phone: this.form.get('phone')!,
            emergency_contact_name: this.form.get('emergency_contact_name')!,
            emergency_contact_phone: this.form.get('emergency_contact_phone')!,
            emergency_contact_relation: this.form.get('emergency_contact_relation')!
        });
        this.clinicalGroup = this.fb.group({
            asthma_type: this.form.get('asthma_type')!,
            personal_best_pef: this.form.get('personal_best_pef')!
        });
    }

    ngOnInit(): void {
        this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.patientId = params['id'];
                this.loadPatient(params['id']);
            } else {
                // Nuevo paciente: email obligatorio para poder enviar la invitación
                const emailCtrl = this.form.get('email')!;
                emailCtrl.setValidators([Validators.required, Validators.email]);
                emailCtrl.setAsyncValidators(this.emailExistsValidator());
                emailCtrl.updateValueAndValidity();
            }
        });
    }

    loadPatient(id: string) {
        this.isLoading = true;
        this.cd.markForCheck();
        this.patientService.getPatientById(id).subscribe({
            next: (p) => {
                queueMicrotask(() => {
                    this.isLoading = false;
                    this.cd.markForCheck();
                });
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
                        personal_best_pef: p.personal_best_pef,
                        blood_type: p.blood_type || '',
                        allergies: p.known_allergies || '',
                        current_medications: p.current_medications || '',
                        family_history_mother: p.family_history_mother || '',
                        family_history_father: p.family_history_father || '',
                        family_history_siblings: p.family_history_siblings || '',
                        family_history_grandparents: p.family_history_grandparents || '',
                        smoking: p.smoking || '',
                        alcohol: p.alcohol || '',
                        exercise: p.exercise || '',
                        diet: p.diet || '',
                        surgeries_traumas: p.surgeries_traumas || '',
                        photo_url: p.photo_url || '',
                        spirometer_id: p.spirometer_id || '',
                        inhaler_id: p.inhaler_id || '',
                    });
                    this.cd.markForCheck();
                }
            },
            error: () => {
                queueMicrotask(() => {
                    this.isLoading = false;
                    this.cd.markForCheck();
                });
                this.snackBar.open('No pudimos cargar la información del paciente. Por favor, intenta de nuevo.', 'Cerrar');
                this.router.navigate(['/dashboard/patients']);
            }
        });
    }

    onSubmit() {
        if (this.form.valid) {
            this.isLoading = true;
            this.cd.markForCheck();
            const formVal = this.form.value;

            // Prepare data
            const patientData = {
                ...formVal,
                latest_pef: this.isEditMode ? formVal.latest_pef : 0,
                riskLevel: this.isEditMode ? formVal.riskLevel : 'low',
                adherence: this.isEditMode ? formVal.adherence : 100
            };

            const request$ = (this.isEditMode && this.patientId)
                ? this.patientService.updatePatient(this.patientId, formVal)
                : this.patientService.addPatient(patientData);

            request$.subscribe({
                next: (response: any) => {
                    queueMicrotask(() => {
                        this.isLoading = false;
                        this.cd.markForCheck();
                    });

                    // Credenciales temporales cuando Supabase no pudo mandar el email
                    const creds = response?.temp_credentials;

                    const successMessage = this.isEditMode
                        ? 'La información del paciente ha sido actualizada correctamente.'
                        : response?.already_exists
                            ? 'Este paciente ya está registrado en AsmaSync. Se ha vinculado a tu lista de pacientes y sus datos médicos se han actualizado. Puede iniciar sesión con sus credenciales de siempre.'
                            : creds
                                ? 'Paciente creado. El correo no pudo enviarse — entrega las credenciales manualmente.'
                                : response?.email_sent
                                    ? 'Paciente creado. Se envió el link de acceso al correo del paciente.'
                                    : 'El nuevo paciente ha sido registrado en el sistema.';

                    // Limpiar estado dirty ANTES de abrir el modal para que
                    // canDeactivate no dispare si el usuario navega manualmente
                    this.form.markAsPristine();
                    this.identityGroup?.markAsPristine();
                    this.clinicalGroup?.markAsPristine();
                    this.hasManualChanges = false;

                    // Open Success Modal
                    const dialogRef = this.dialog.open(SuccessModalComponent, {
                        panelClass: 'success-modal-panel',
                        disableClose: false,
                        data: {
                            title: this.isEditMode ? '¡Actualizado!' : response?.already_exists ? '¡Paciente Vinculado!' : '¡Paciente Guardado!',
                            message: successMessage,
                            buttonText: 'Continuar',
                            // Extra: show credentials box if available
                            credentials: creds || null
                        }
                    });

                    const targetUrl = (this.isEditMode && this.patientId)
                        ? ['/dashboard/patients', this.patientId]
                        : ['/dashboard/patients'];

                    // Navegar al cerrar el modal (sea por botón o auto-cierre)
                    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
                        this.router.navigate(targetUrl);
                    });

                    // Auto-close after 7s if credentials/already_exists, 2s otherwise
                    const delay = (creds || response?.already_exists) ? 7000 : 2000;
                    setTimeout(() => dialogRef.close(), delay);
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
        queueMicrotask(() => {
            this.isLoading = false;
            this.cd.markForCheck();
        });

        // Prevent raw Angular/ExpressionChanged errors from showing to the user
        let errorMsg = 'No pudimos guardar los cambios. Revisa tu conexión.';
        if (e && e.error && e.error.detail) {
            errorMsg = typeof e.error.detail === 'string' ? e.error.detail : 'Error de validación en los datos provistos.';
        }

        this.toastService.show(errorMsg, 'error');
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
                    this.cd.markForCheck();
                }, 0);
            };
            reader.readAsDataURL(file);
        }
    }

    removePhoto(): void {
        this.photoPreview = null;
        this.form.patchValue({ photo_url: '' });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    async canDeactivate(): Promise<boolean> {
        const isActuallyDirty = this.hasManualChanges || this.form.dirty;

        // If form is dirty and not submitted, confirm exit
        if (isActuallyDirty && !this.isLoading) {
            const dialogRef = this.dialog.open(ConfirmDialogComponent, {
                width: '400px',
                disableClose: true,
                data: {
                    title: 'Cambios sin guardar',
                    message: 'Tienes información que no has guardado. ¿Estás seguro de que quieres salir?',
                    confirmText: 'Salir sin guardar',
                    cancelText: 'Seguir editando',
                    isDestructive: true
                }
            });

            const result = await firstValueFrom(dialogRef.afterClosed());
            return !!result;
        }
        return true;
    }

    goBack() {
        this.router.navigate(['/dashboard/patients']);
    }

    // Campos requeridos por tab
    private readonly TAB_FIELDS: Record<number, string[]> = {
        0: ['full_name', 'date_of_birth', 'gender', 'weight', 'height', 'email'],
        1: ['asthma_type', 'personal_best_pef'],
        2: []
    };

    private validateCurrentTab(): boolean {
        const fields = this.TAB_FIELDS[this.selectedTabIndex] ?? [];
        // En modo edición el email no es obligatorio
        const toValidate = this.isEditMode ? fields.filter(f => f !== 'email') : fields;
        let valid = true;
        toValidate.forEach(f => {
            const ctrl = this.form.get(f);
            if (ctrl) {
                ctrl.markAsTouched();
                ctrl.updateValueAndValidity();
                if (ctrl.invalid) valid = false;
            }
        });
        if (!valid) this.cd.markForCheck();
        return valid;
    }

    onTabHeaderClick(targetIndex: number): void {
        // Si intenta ir hacia adelante, valida tab actual primero
        if (targetIndex > this.selectedTabIndex) {
            if (!this.validateCurrentTab()) {
                this.toastService.show('Completa los campos obligatorios antes de continuar', 'error');
                return;
            }
        }
        this.selectedTabIndex = targetIndex;
        this.cd.markForCheck();
    }

    nextTab(): void {
        if (!this.validateCurrentTab()) {
            this.toastService.show('Completa los campos obligatorios antes de continuar', 'error');
            return;
        }
        if (this.selectedTabIndex < this.TAB_COUNT - 1) {
            this.selectedTabIndex++;
            this.cd.markForCheck();
        }
    }

    prevTab(): void {
        if (this.selectedTabIndex > 0) {
            this.selectedTabIndex--;
            this.cd.markForCheck();
        }
    }

    get isFirstTab(): boolean { return this.selectedTabIndex === 0; }
    get isLastTab(): boolean { return this.selectedTabIndex === this.TAB_COUNT - 1; }

    get tab1Valid(): boolean {
        const fields = ['full_name', 'date_of_birth', 'gender', 'weight', 'height'];
        return fields.every(f => this.form.get(f)?.valid);
    }
}

