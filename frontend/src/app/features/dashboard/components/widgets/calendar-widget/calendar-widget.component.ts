import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { map, Observable } from 'rxjs';
import { AppointmentService } from '../../../../../core/services/appointment.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppointmentDialogComponent } from '../../appointment-dialog/appointment-dialog.component';

@Component({
    selector: 'app-calendar-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule, AsyncPipe, MatDialogModule, MatSnackBarModule],
    templateUrl: './calendar-widget.component.html',
    styleUrls: ['./calendar-widget.component.scss']
})
export class CalendarWidgetComponent {
    appointments$: Observable<any[]>;

    constructor(
        private appointmentService: AppointmentService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) {
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date();
        end.setDate(end.getDate() + 7); // Next 7 days
        
        const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

        this.appointments$ = this.appointmentService.getAppointments(start, end).pipe(
            map(appts => appts.map(a => {
                const dateObj = new Date(a.date);
                const endDateObj = new Date(dateObj.getTime() + (a.durationMinutes * 60000));
                
                // Color formatting based on type
                let colorClass = 'bg-indigo-50 text-indigo-600';
                if(a.type === 'test') colorClass = 'bg-orange-50 text-orange-600';
                else if(a.type === 'follow_up') colorClass = 'bg-emerald-50 text-emerald-600';

                return {
                    month: monthNames[dateObj.getMonth()],
                    day: dateObj.getDate().toString().padStart(2, '0'),
                    title: `${a.type === 'checkup' ? 'Consulta' : a.type === 'test' ? 'Estudio' : 'Revisión'}: ${a.patientName}`,
                    time: `${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endDateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
                    colorClass
                };
            }))
        );
    }

    openNewAppointment(): void {
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
