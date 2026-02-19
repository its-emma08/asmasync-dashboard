import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
    selector: 'app-appointment-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    template: `
    <h2 mat-dialog-title class="!font-bold !text-slate-800 flex items-center gap-2">
        <mat-icon class="text-brand-cyan">event</mat-icon> Nueva Cita
    </h2>
    <mat-dialog-content>
        <p class="text-sm text-slate-500 mb-4">Agende una nueva cita o recordatorio en el calendario.</p>
        
        <div class="flex flex-col gap-3">
            <mat-form-field appearance="outline" class="w-full">
                <mat-label>Título / Paciente</mat-label>
                <input matInput [(ngModel)]="data.title" placeholder="Ej. Consulta: Juan Pérez">
                <mat-icon matPrefix class="text-slate-400 mr-2">person</mat-icon>
            </mat-form-field>

            <div class="grid grid-cols-2 gap-3">
                <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Fecha</mat-label>
                    <input matInput [matDatepicker]="picker" [(ngModel)]="data.date">
                    <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                    <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Hora</mat-label>
                    <input matInput [(ngModel)]="data.time" placeholder="09:00 AM">
                    <mat-icon matPrefix class="text-slate-400 mr-2">schedule</mat-icon>
                </mat-form-field>
            </div>
        </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="!pb-6 !pr-6">
        <button mat-button mat-dialog-close class="!text-slate-500 !font-bold">Cancelar</button>
        <button mat-flat-button color="primary" [mat-dialog-close]="data" [disabled]="!data.title || !data.date" class="!rounded-lg">
            Agendar
        </button>
    </mat-dialog-actions>
  `,
    styles: [`
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
        border-radius: 20px !important;
        padding: 0; 
    }
  `]
})
export class AppointmentDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<AppointmentDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        // Init defaults
        if (!this.data) this.data = {};
        if (!this.data.date) this.data.date = new Date();
    }
}
