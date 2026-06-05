import { Component, Inject, OnInit, LOCALE_ID, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PatientService } from '../../../../core/services/patient.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

interface PatientOption { id: string | number; full_name: string; }

@Component({
    selector: 'app-appointment-dialog',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatSnackBarModule
    ],
    providers: [{ provide: LOCALE_ID, useValue: 'es-ES' }],
    template: `
    <div class="apple-dialog-root">
      <header class="apple-dialog-header">
        <div class="header-content">
            <mat-icon class="brand-primary-text">{{ isEdit ? 'edit_calendar' : 'calendar_add_on' }}</mat-icon>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">{{ isEdit ? 'Editar Cita' : 'Nueva Cita' }}</h2>
        </div>
        <button mat-icon-button mat-dialog-close class="text-slate-400">
            <mat-icon>close</mat-icon>
        </button>
      </header>

      <mat-dialog-content class="!p-0 !overflow-hidden">
        <div class="apple-group-section">
            <div class="apple-row-input">
                <mat-icon class="row-icon brand-primary-text">person</mat-icon>
                <div class="flex-1">
                    <mat-select [(ngModel)]="data.patientId" required placeholder="Seleccionar Paciente" class="apple-select">
                        <mat-option *ngFor="let patient of patients" [value]="patient.id">
                            {{ patient.full_name }}
                        </mat-option>
                    </mat-select>
                </div>
            </div>
            <div class="apple-divider-inc"></div>
            <div class="apple-row-input">
                <mat-icon class="row-icon text-slate-400">notes</mat-icon>
                <input matInput [(ngModel)]="data.notes" placeholder="Motivo de la consulta" class="apple-input-field">
            </div>
        </div>

        <div class="apple-group-label">Fecha y Hora</div>
        <div class="apple-group-section">
            <div class="apple-row-input" (click)="picker.open()">
                <mat-icon class="row-icon text-red-500">calendar_today</mat-icon>
                <div class="flex-1 flex justify-between items-center cursor-pointer">
                    <span class="text-slate-600 dark:text-slate-300 font-medium">Fecha</span>
                    <span class="brand-primary-text font-semibold">{{ data.date | date:'EEE, d MMM yyyy':'':'es-ES' }}</span>
                </div>
                <input [matDatepicker]="picker" [(ngModel)]="data.date" [min]="today" class="hidden">
                <mat-datepicker #picker></mat-datepicker>
            </div>
            <div class="apple-divider-inc"></div>
            <div class="apple-row-input">
                <mat-icon class="row-icon text-orange-500">schedule</mat-icon>
                <div class="flex-1 flex justify-between items-center">
                    <span class="text-slate-600 dark:text-slate-300 font-medium">Hora</span>
                    <input type="time" [(ngModel)]="data.time" class="apple-time-pill">
                </div>
            </div>
            <div class="apple-divider-inc"></div>
            <div class="apple-row-input">
                <mat-icon class="row-icon text-purple-500">timer</mat-icon>
                <div class="flex-1 flex justify-between items-center">
                    <span class="text-slate-600 dark:text-slate-300 font-medium">Duración</span>
                    <mat-select [(ngModel)]="data.duration_minutes" class="apple-select-mini">
                        <mat-option [value]="15">15 min</mat-option>
                        <mat-option [value]="30">30 min</mat-option>
                        <mat-option [value]="45">45 min</mat-option>
                        <mat-option [value]="60">1 hora</mat-option>
                    </mat-select>
                </div>
            </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="!px-6 !pb-8 !pt-4 bg-[#F2F2F7] dark:bg-[#1C1C1E]">
        <button *ngIf="isEdit" mat-button color="warn" (click)="delete()" [disabled]="loading" class="apple-btn-danger">
            Eliminar Cita
        </button>
        <div class="flex gap-3 ml-auto">
            <button mat-button mat-dialog-close class="apple-btn-cancel">Cancelar</button>
            <button mat-flat-button color="primary" (click)="save()" [disabled]="!data.patientId || !data.date || loading" class="apple-btn-main">
                <mat-spinner diameter="18" *ngIf="loading" class="mr-2"></mat-spinner>
                {{ isEdit ? 'Actualizar' : 'Agendar' }}
            </button>
        </div>
      </mat-dialog-actions>
    </div>
  `,
    styles: [`
    .apple-dialog-root {
        background: #F2F2F7;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .dark .apple-dialog-root { background: #000000; }

    .apple-dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(20px);
        border-bottom: 0.5px solid rgba(0,0,0,0.1);
    }
    .dark .apple-dialog-header { background: rgba(28, 28, 30, 0.8); border-bottom-color: rgba(255,255,255,0.1); }

    .header-content { display: flex; align-items: center; gap: 12px; }

    .brand-primary-text {
        color: var(--brand-primary) !important;
    }

    .apple-group-label {
        font-size: 13px;
        font-weight: 500;
        color: #8E8E93;
        text-transform: uppercase;
        margin: 24px 24px 8px;
        letter-spacing: 0.05em;
    }

    .apple-group-section {
        background: white;
        margin: 0 16px;
        border-radius: 12px;
        overflow: hidden;
    }
    .dark .apple-group-section { background: #1C1C1E; }

    .apple-row-input {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        gap: 16px;
        min-height: 52px;
    }

    .row-icon { font-size: 20px; width: 20px; height: 20px; }

    .apple-input-field {
        width: 100%;
        border: none;
        outline: none;
        background: transparent;
        font-size: 16px;
        color: var(--text-primary);
    }

    .apple-select {
        width: 100%;
        font-size: 16px;
    }

    .apple-divider-inc {
        height: 0.5px;
        background: #C6C6C8;
        margin-left: 52px;
    }
    .dark .apple-divider-inc { background: #38383A; }

    .apple-time-pill {
        background: #E3E3E8;
        border: none;
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 15px;
        font-weight: 600;
        color: var(--brand-primary);
        outline: none;
    }
    .dark .apple-time-pill { background: #3A3A3C; }

    .apple-select-mini {
        width: 80px;
        font-size: 15px;
        font-weight: 600;
        color: var(--brand-primary);
    }

    .apple-btn-main {
        border-radius: 10px !important;
        font-weight: 700 !important;
        padding: 0 24px !important;
        height: 44px !important;
        background: var(--brand-primary) !important;
        box-shadow: 0 4px 12px var(--brand-primary-shadow) !important;
        transition: all 0.2s ease-in-out !important;
        color: white !important;
    }
    .apple-btn-main:hover:not([disabled]) {
        background: var(--brand-primary-hover) !important;
        box-shadow: 0 6px 20px var(--brand-primary-shadow) !important;
        transform: translateY(-1px);
    }
    .apple-btn-main[disabled] {
        opacity: 0.5 !important;
        box-shadow: none !important;
        transform: none !important;
    }

    .apple-btn-cancel {
        font-weight: 600 !important;
        color: var(--brand-primary) !important;
    }

    .apple-btn-danger {
        font-weight: 600 !important;
        color: #FF3B30 !important;
    }

    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
        border-radius: 20px !important;
        overflow: hidden !important;
    }
  `]
})
export class AppointmentDialogComponent implements OnInit {
    patients: PatientOption[] = [];
    isEdit = false;
    loading = false;
    readonly today = new Date();

    constructor(
        public dialogRef: MatDialogRef<AppointmentDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private patientService: PatientService,
        private appointmentService: AppointmentService,
        private snackBar: MatSnackBar,
        private cd: ChangeDetectorRef,
        private dialog: MatDialog
    ) {
        if (!this.data) this.data = {};
        this.isEdit = !!this.data.appointment;
        
        if (this.isEdit) {
            const appt = this.data.appointment;
            this.data.patientId = appt.patientId;
            this.data.notes = appt.notes;
            this.data.date = new Date(appt.date);
            // Format time for <input type="time">
            const d = new Date(appt.date);
            this.data.time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        } else if (!this.data.date) {
            this.data.date = new Date();
        }
    }

    ngOnInit(): void {
        this.patientService.getAllPatients().subscribe(patients => {
            this.patients = patients.map(p => ({ id: p.id, full_name: p.full_name }));
            this.cd.markForCheck();
        });
    }

    save(): void {
        const [hours, minutes] = (this.data.time || '09:00').split(':');
        const finalDate = new Date(this.data.date);
        finalDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (!this.isEdit && finalDate < new Date()) {
            this.snackBar.open('No puedes agendar una cita en el pasado', 'Cerrar', { duration: 3000 });
            return;
        }

        this.loading = true;

        if (this.isEdit) {
            const updateDto = {
                date: finalDate.toISOString(),
                notes: this.data.notes,
                duration_minutes: this.data.duration_minutes || 30
            };
            this.appointmentService.updateAppointment(this.data.appointment.id, updateDto as any).subscribe({
                next: () => {
                    this.snackBar.open('Cita actualizada con éxito', 'OK', { duration: 3000 });
                    this.dialogRef.close('updated');
                },
                error: (err: any) => {
                    this.loading = false;
                    const msg = err?.status === 409
                        ? 'Conflicto de horario: ya tienes otra cita en ese intervalo.'
                        : 'Error al actualizar la cita. Intenta de nuevo.';
                    this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
                    this.cd.markForCheck();
                }
            });
        } else {
            const createDto = {
                patient_id: this.data.patientId,
                date: finalDate.toISOString(),
                notes: this.data.notes,
                type: 'checkup',
                duration_minutes: this.data.duration_minutes || 30
            };
            this.appointmentService.createAppointment(createDto as any).subscribe({
                next: () => {
                    this.snackBar.open('Cita agendada con éxito', 'OK', { duration: 3000 });
                    this.dialogRef.close('created');
                },
                error: (err: any) => {
                    this.loading = false;
                    const msg = err?.status === 409
                        ? 'Conflicto de horario: ya tienes otra cita en ese intervalo.'
                        : 'Error al agendar cita. Intenta de nuevo.';
                    this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
                    this.cd.markForCheck();
                }
            });
        }
    }

    delete(): void {
        const ref = this.dialog.open(ConfirmDialogComponent, {
            width: '380px',
            data: {
                title: 'Eliminar cita',
                message: '¿Está seguro de que desea eliminar esta cita? Esta acción no se puede deshacer.',
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
                isDestructive: true
            }
        });
        ref.afterClosed().subscribe(confirmed => {
            if (!confirmed) return;
            this.loading = true;
            this.cd.markForCheck();
            this.appointmentService.deleteAppointment(this.data.appointment.id).subscribe({
                next: () => {
                    this.snackBar.open('Cita eliminada', 'OK', { duration: 3000 });
                    this.dialogRef.close('deleted');
                },
                error: () => {
                    this.loading = false;
                    this.snackBar.open('Error al eliminar la cita', 'Cerrar', { duration: 4000 });
                    this.cd.markForCheck();
                }
            });
        });
    }
}
