import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppointmentService } from '../../../../../core/services/appointment.service';
import { AppointmentDialogComponent } from '../../appointment-dialog/appointment-dialog.component';

const ACTIONS = [
    {
        label: 'Nuevo Paciente',
        icon: 'person_add',
        route: '/dashboard/patients/new',
        bg: 'bg-indigo-50 dark:bg-indigo-500/10',
        iconBg: 'bg-indigo-100 dark:bg-indigo-500/20',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        hoverBg: 'hover:bg-indigo-100 dark:hover:bg-indigo-500/20',
        shadow: 'hover:shadow-indigo-100 dark:hover:shadow-indigo-900/30',
    },
    {
        label: 'Nueva Cita',
        icon: 'calendar_add_on',
        route: null,
        action: 'appointment',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        iconBg: 'bg-amber-100 dark:bg-amber-500/20',
        iconColor: 'text-amber-600 dark:text-amber-400',
        hoverBg: 'hover:bg-amber-100 dark:hover:bg-amber-500/20',
        shadow: 'hover:shadow-amber-100 dark:hover:shadow-amber-900/30',
    },
    {
        label: 'Reportes',
        icon: 'post_add',
        route: '/dashboard/reports',
        bg: 'bg-teal-50 dark:bg-teal-500/10',
        iconBg: 'bg-teal-100 dark:bg-teal-500/20',
        iconColor: 'text-teal-600 dark:text-teal-400',
        hoverBg: 'hover:bg-teal-100 dark:hover:bg-teal-500/20',
        shadow: 'hover:shadow-teal-100 dark:hover:shadow-teal-900/30',
    },
    {
        label: 'Alertas',
        icon: 'campaign',
        route: '/dashboard/alerts',
        bg: 'bg-red-50 dark:bg-red-500/10',
        iconBg: 'bg-red-100 dark:bg-red-500/20',
        iconColor: 'text-red-600 dark:text-red-400',
        hoverBg: 'hover:bg-red-100 dark:hover:bg-red-500/20',
        shadow: 'hover:shadow-red-100 dark:hover:shadow-red-900/30',
    },
];

@Component({
    selector: 'app-quick-actions-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatRippleModule, RouterModule, MatDialogModule, MatSnackBarModule, MatTooltipModule],
    template: `
    <div class="h-full flex flex-col bg-transparent overflow-hidden">

        <!-- Header -->
        <div class="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700/50 flex-shrink-0">
            <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <mat-icon class="text-slate-500 dark:text-slate-400 !text-lg">bolt</mat-icon>
            </div>
            <div>
                <h3 class="font-bold text-slate-800 dark:text-white text-sm leading-tight">Acciones Rápidas</h3>
                <p class="text-[10px] text-slate-400 font-medium">Acceso directo</p>
            </div>
        </div>

        <!-- Actions list - compact rows -->
        <div class="flex-1 flex flex-col justify-evenly px-4 pb-4 gap-1.5 overflow-hidden">
            <ng-container *ngFor="let action of actions">
                <!-- Routed action -->
                <button *ngIf="action.route" matRipple
                    [routerLink]="action.route"
                    class="group flex items-center gap-3 rounded-2xl px-4 py-3 w-full transition-all duration-200 hover:brightness-95 dark:hover:brightness-110 active:scale-[0.97] cursor-pointer text-left"
                    [class]="action.bg">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        [class]="action.iconBg">
                        <mat-icon class="!text-lg" [class]="action.iconColor">{{ action.icon }}</mat-icon>
                    </div>
                    <span class="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight flex-1">{{ action.label }}</span>
                    <mat-icon class="!text-base text-slate-400 dark:text-slate-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">chevron_right</mat-icon>
                </button>

                <!-- Dialog action -->
                <button *ngIf="!action.route" matRipple
                    (click)="onActionClick(action)"
                    class="group flex items-center gap-3 rounded-2xl px-4 py-3 w-full transition-all duration-200 hover:brightness-95 dark:hover:brightness-110 active:scale-[0.97] cursor-pointer text-left"
                    [class]="action.bg">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        [class]="action.iconBg">
                        <mat-icon class="!text-lg" [class]="action.iconColor">{{ action.icon }}</mat-icon>
                    </div>
                    <span class="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight flex-1">{{ action.label }}</span>
                    <mat-icon class="!text-base text-slate-400 dark:text-slate-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">chevron_right</mat-icon>
                </button>
            </ng-container>
        </div>
    </div>
  `
})
export class QuickActionsWidgetComponent {
    actions = ACTIONS;

    constructor(
        private dialog: MatDialog,
        private appointmentService: AppointmentService,
        private snackBar: MatSnackBar
    ) { }

    onActionClick(action: any) {
        if (action.action === 'appointment') {
            this.openAppointmentDialog();
        }
    }

    openAppointmentDialog() {
        const dialogRef = this.dialog.open(AppointmentDialogComponent, {
            width: '450px',
            data: { title: '', time: '09:00 AM' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.patientId) {
                const d = new Date(result.date);
                const dto = {
                    patientId: result.patientId,
                    date: d.toISOString(),
                    durationMinutes: 30,
                    type: 'checkup',
                    notes: result.notes || result.title || ''
                };
                
                this.appointmentService.createAppointment(dto as any).subscribe({
                    next: () => {
                        this.snackBar.open('Cita agendada correctamente', 'Cerrar', {
                            duration: 3000,
                            panelClass: 'glass-toast'
                        });
                    },
                    error: (err) => {
                        console.error(err);
                        this.snackBar.open('Error al agendar cita', 'Cerrar', { duration: 3000 });
                    }
                });
            }
        });
    }
}
