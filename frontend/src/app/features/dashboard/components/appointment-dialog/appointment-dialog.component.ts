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
    <div class="appointment-modal-container">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-badge-icon">
          <mat-icon>{{ isEdit ? 'edit_calendar' : 'event_available' }}</mat-icon>
        </div>
        <div class="header-text-group">
          <h2 class="modal-title">{{ isEdit ? 'Editar Cita Médica' : 'Agendar Nueva Cita' }}</h2>
          <p class="modal-subtitle">Programe la consulta médica con el paciente</p>
        </div>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Modal Content Body -->
      <mat-dialog-content class="modal-body custom-scroll">
        <!-- Patient Selection -->
        <div class="field-group">
          <label class="field-label">Paciente <span class="required">*</span></label>
          <div class="input-card">
            <mat-icon class="input-icon brand-icon">person</mat-icon>
            <mat-select [(ngModel)]="data.patientId" required placeholder="Seleccionar paciente de la lista..." class="custom-select">
              <mat-option *ngFor="let patient of patients" [value]="patient.id">
                {{ patient.full_name }}
              </mat-option>
            </mat-select>
          </div>
        </div>

        <!-- Consultation Reason / Notes -->
        <div class="field-group">
          <label class="field-label">Motivo de Consulta / Notas</label>
          <div class="input-card">
            <mat-icon class="input-icon">notes</mat-icon>
            <input matInput [(ngModel)]="data.notes" placeholder="Ej. Control mensual, espirometría, revisión..." class="custom-input">
          </div>
        </div>

        <!-- Date & Time Section -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Date Picker Card -->
          <div class="field-group">
            <label class="field-label">Fecha de la Cita <span class="required">*</span></label>
            <div class="input-card date-card-anchor relative cursor-pointer" (click)="picker.open()">
              <mat-icon class="input-icon text-teal-600 dark:text-teal-400">calendar_month</mat-icon>
              <div class="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {{ data.date ? (data.date | date:'EEE, d MMM yyyy':'':'es-ES') : 'Seleccionar fecha' }}
              </div>
              <mat-icon class="text-slate-400 text-sm">expand_more</mat-icon>
              <!-- Positioned input so CDK calculates bounding box relative to card -->
              <input [matDatepicker]="picker" [(ngModel)]="data.date" [min]="today"
                     style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 2;">
              <mat-datepicker #picker></mat-datepicker>
            </div>
          </div>

          <!-- Time Picker Card -->
          <div class="field-group">
            <label class="field-label">Hora <span class="required">*</span></label>
            <div class="input-card">
              <mat-icon class="input-icon text-amber-500">schedule</mat-icon>
              <input type="time" [(ngModel)]="data.time" class="time-input">
            </div>
          </div>
        </div>

        <!-- Duration Selection Chips -->
        <div class="field-group">
          <label class="field-label">Duración Estimada</label>
          <div class="flex gap-2">
            <button type="button" *ngFor="let option of durationOptions"
                    (click)="data.duration_minutes = option.value"
                    class="duration-pill"
                    [class.active]="(data.duration_minutes || 30) === option.value">
              <mat-icon class="!text-xs" *ngIf="(data.duration_minutes || 30) === option.value">check</mat-icon>
              <span>{{ option.label }}</span>
            </button>
          </div>
        </div>
      </mat-dialog-content>

      <!-- Modal Footer / Actions -->
      <mat-dialog-actions class="modal-footer">
        <button *ngIf="isEdit" mat-button (click)="delete()" [disabled]="loading" class="danger-btn">
          <mat-icon>delete_outline</mat-icon> Eliminar Cita
        </button>

        <div class="flex gap-3 ml-auto">
          <button mat-button mat-dialog-close class="cancel-btn">Cancelar</button>
          <button mat-flat-button color="primary" (click)="save()" [disabled]="!data.patientId || !data.date || loading" class="save-btn">
            <mat-spinner diameter="18" *ngIf="loading" class="mr-2"></mat-spinner>
            <mat-icon *ngIf="!loading">calendar_month</mat-icon>
            <span>{{ isEdit ? 'Guardar Cambios' : 'Agendar Cita' }}</span>
          </button>
        </div>
      </mat-dialog-actions>
    </div>
  `,
    styles: [`
      .appointment-modal-container {
        display: flex;
        flex-direction: column;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        color: #0f172a;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      }

      :host-context(.dark) .appointment-modal-container,
      .dark .appointment-modal-container {
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .modal-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px 28px 18px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      }

      .dark .modal-header {
        border-bottom-color: rgba(255, 255, 255, 0.08);
      }

      .header-badge-icon {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: linear-gradient(135deg, rgba(26, 111, 232, 0.12), rgba(14, 165, 201, 0.12));
        color: #1A6FE8;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .dark .header-badge-icon {
        background: rgba(26, 111, 232, 0.25);
        color: #38bdf8;
      }

      .header-text-group { flex: 1; }
      .modal-title { font-size: 18px; font-weight: 700; margin: 0; }
      .modal-subtitle { font-size: 12px; color: #64748b; margin: 2px 0 0; }
      .dark .modal-subtitle { color: #94a3b8; }

      .close-btn { color: #94a3b8; transition: all 0.2s ease; }
      .close-btn:hover { color: #0f172a; background: rgba(0,0,0,0.05); }
      .dark .close-btn:hover { color: #ffffff; background: rgba(255,255,255,0.1); }

      .modal-body {
        padding: 24px 28px !important;
        display: flex;
        flex-direction: column;
        gap: 18px;
        max-height: 75vh;
        overflow-y: auto;
      }

      .field-group { display: flex; flex-direction: column; gap: 6px; }
      .field-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #475569; }
      .dark .field-label { color: #94a3b8; }
      .required { color: #ef4444; }

      .input-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        border-radius: 14px;
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        transition: all 0.2s ease;
        min-height: 48px;
      }

      .dark .input-card {
        background: #1e293b;
        border-color: #334155;
      }

      .input-card:hover, .input-card:focus-within {
        border-color: #1A6FE8;
        box-shadow: 0 0 0 3px rgba(26, 111, 232, 0.12);
      }

      .input-icon { color: #64748b; font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
      .dark .input-icon { color: #94a3b8; }
      .brand-icon { color: #1A6FE8 !important; }
      .dark .brand-icon { color: #38bdf8 !important; }

      .custom-input {
        width: 100%;
        border: none;
        outline: none;
        background: transparent;
        font-size: 14px;
        color: inherit;
        font-weight: 500;
      }

      .custom-select { width: 100%; font-size: 14px; font-weight: 500; }

      .time-input {
        border: none;
        outline: none;
        background: transparent;
        font-size: 15px;
        font-weight: 700;
        color: #1A6FE8;
        width: 100%;
        cursor: pointer;
      }
      .dark .time-input { color: #38bdf8; }

      .duration-pill {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 600;
        border: 1.5px solid #e2e8f0;
        background: #f8fafc;
        color: #64748b;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .dark .duration-pill {
        background: #1e293b;
        border-color: #334155;
        color: #94a3b8;
      }

      .duration-pill.active {
        background: rgba(26, 111, 232, 0.12);
        border-color: #1A6FE8;
        color: #1A6FE8;
      }

      .dark .duration-pill.active {
        background: rgba(56, 189, 248, 0.15);
        border-color: #38bdf8;
        color: #38bdf8;
      }

      .modal-footer {
        display: flex;
        align-items: center;
        padding: 16px 28px 24px;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
        background: #f8fafc;
      }

      .dark .modal-footer {
        background: #0b1426;
        border-top-color: rgba(255, 255, 255, 0.08);
      }

      .save-btn {
        border-radius: 12px !important;
        height: 44px !important;
        padding: 0 24px !important;
        font-weight: 700 !important;
        background: linear-gradient(135deg, #1A6FE8, #0EA5C9) !important;
        box-shadow: 0 4px 14px rgba(26, 111, 232, 0.25) !important;
        color: white !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
      }

      .save-btn:hover:not([disabled]) {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(26, 111, 232, 0.35) !important;
      }

      .cancel-btn {
        border-radius: 12px !important;
        height: 44px !important;
        font-weight: 600 !important;
        color: #64748b !important;
      }

      .danger-btn {
        color: #ef4444 !important;
        font-weight: 600 !important;
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
      }
    `]
})
export class AppointmentDialogComponent implements OnInit {
    patients: PatientOption[] = [];
    isEdit = false;
    loading = false;
    readonly today = new Date();
    readonly durationOptions = [
        { label: '15 min', value: 15 },
        { label: '30 min', value: 30 },
        { label: '45 min', value: 45 },
        { label: '1 hora', value: 60 }
    ];

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
