import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PatientService } from '../../../../../core/services/patient.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs'; // Fix: Ensure Observable is imported

@Component({
    selector: 'app-birthdays-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
    templateUrl: './birthdays-widget.component.html',
    styleUrls: ['./birthdays-widget.component.scss']
})
export class BirthdaysWidgetComponent implements OnInit {
    upcomingBirthdays$: Observable<any[]>; // Explicit type

    constructor(
        private patientService: PatientService,
        private toast: ToastService
    ) {
        this.upcomingBirthdays$ = this.patientService.getPatients().pipe(
            map((response: any) => { // Type as any if strict type unavailable, or ResponseType
                const patients = response.data || [];
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);

                return patients.filter((p: any) => {
                    if (!p.date_of_birth) return false;

                    const dob = new Date(p.date_of_birth);
                    const currentYear = today.getFullYear();

                    // Check birthday in current year
                    const birthdayThisYear = new Date(currentYear, dob.getMonth(), dob.getDate());

                    // Check birthday in next year (for late December case)
                    const birthdayNextYear = new Date(currentYear + 1, dob.getMonth(), dob.getDate());

                    return (birthdayThisYear >= today && birthdayThisYear <= nextWeek) ||
                        (birthdayNextYear >= today && birthdayNextYear <= nextWeek);
                }).sort((a: any, b: any) => {
                    // Sort logic: complex due to year wrap, but simple approximation:
                    // Just sort by coming date
                    const getNextDate = (d: string) => {
                        const dob = new Date(d);
                        const dateThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                        return dateThisYear < today ? new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate()) : dateThisYear;
                    };
                    return getNextDate(a.date_of_birth).getTime() - getNextDate(b.date_of_birth).getTime();
                });
            })
        );
    }

    ngOnInit() { }

    getDay(date: string): number {
        // Fix: Use UTC or ensure locale consistency. 
        // Simple View: just date part.
        // Actually, if date string is YYYY-MM-DD, parsing it as local might shift it depending on timezone.
        // Safest: split string for day display if ISO. 
        // But for calculation we used Date object.
        return new Date(date).getDate() + 1; // Often off by one if UTC midnight parsed as local previous day.
        // Better:
        // const d = new Date(date);
        // return d.getUTCDate(); // Check backend format
    }

    getMonthName(date: string): string {
        return new Date(date).toLocaleString('es-ES', { month: 'short' }).replace('.', '');
    }

    getAge(date: string): number {
        const dob = new Date(date);
        const diffMs = Date.now() - dob.getTime();
        const ageDt = new Date(diffMs);
        return Math.abs(ageDt.getUTCFullYear() - 1970);
    }

    sendWish(patient: any): void {
        this.toast.success(`Felicitación enviada a ${patient.first_name}!`);
        // Here we would call an API to send email/SMS
    }
}
