import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DashboardService } from '../../../services/dashboard.service';
import { AppointmentDialogComponent } from '../../appointment-dialog/appointment-dialog.component';

@Component({
    selector: 'app-quick-actions-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatRippleModule, RouterModule, MatDialogModule, MatSnackBarModule],
    template: `
    <div class="h-full p-5 bg-white flex flex-col justify-center">
        <div class="grid grid-cols-2 gap-3 h-full">
            <button matRipple routerLink="/dashboard/patients/new" class="flex flex-col items-center justify-center bg-indigo-50 hover:bg-indigo-100 rounded-2xl p-2 transition-colors group cursor-pointer">
                <div class="w-10 h-10 rounded-full bg-indigo-100 group-hover:bg-white flex items-center justify-center text-indigo-600 mb-2 transition-colors">
                    <mat-icon>person_add</mat-icon>
                </div>
                <span class="text-xs font-bold text-indigo-900">Nuevo Paciente</span>
            </button>

            <!-- Hidden per Phase 29 requirement -->
            <!-- <button matRipple (click)="sendAlert()" class="flex flex-col items-center justify-center bg-rose-50 hover:bg-rose-100 rounded-2xl p-2 transition-colors group cursor-pointer">
                <div class="w-10 h-10 rounded-full bg-rose-100 group-hover:bg-white flex items-center justify-center text-rose-600 mb-2 transition-colors">
                    <mat-icon>emergency_share</mat-icon>
                </div>
                <span class="text-xs font-bold text-rose-900">Enviar Alerta</span>
            </button> -->

            <button matRipple routerLink="/dashboard/reports" class="flex flex-col items-center justify-center bg-teal-50 hover:bg-teal-100 rounded-2xl p-2 transition-colors group cursor-pointer">
                <div class="w-10 h-10 rounded-full bg-teal-100 group-hover:bg-white flex items-center justify-center text-teal-600 mb-2 transition-colors">
                    <mat-icon>post_add</mat-icon>
                </div>
                <span class="text-xs font-bold text-teal-900">Crear Reporte</span>
            </button>

            <button matRipple (click)="openAppointmentDialog()" class="flex flex-col items-center justify-center bg-amber-50 hover:bg-amber-100 rounded-2xl p-2 transition-colors group cursor-pointer">
                <div class="w-10 h-10 rounded-full bg-amber-100 group-hover:bg-white flex items-center justify-center text-amber-600 mb-2 transition-colors">
                    <mat-icon>calendar_add_on</mat-icon>
                </div>
                <span class="text-xs font-bold text-amber-900">Cita</span>
            </button>
        </div>
    </div>
  `,
    styles: []
})
export class QuickActionsWidgetComponent {
    constructor(private dialog: MatDialog, private dashboardService: DashboardService, private snackBar: MatSnackBar) { }

    openAppointmentDialog() {
        const dialogRef = this.dialog.open(AppointmentDialogComponent, {
            width: '450px',
            data: { title: '', time: '09:00 AM' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Formatting for display
                const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
                const d = new Date(result.date);

                const newApt = {
                    month: monthNames[d.getMonth()],
                    day: d.getDate().toString(),
                    title: result.title,
                    time: result.time,
                    colorClass: 'bg-indigo-50 text-indigo-600' // Default color
                };

                this.dashboardService.addAppointment(newApt);
                this.snackBar.open('Cita agendada correctamente', 'Cerrar', { duration: 3000, panelClass: 'glass-toast' });
            }
        });
    }

    sendAlert() {
        // Mock alert action
        alert('Funcionalidad de Envío de Alerta Masiva en desarrollo (Fase 29)');
    }
}
