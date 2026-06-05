import { Component, ChangeDetectionStrategy } from '@angular/core';
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
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
    templateUrl: './birthdays-widget.component.html',
    styleUrls: ['./birthdays-widget.component.scss']
})
export class BirthdaysWidgetComponent {
    upcomingBirthdays$: Observable<any[]>; // Explicit type

    constructor(
        private patientService: PatientService,
        private toast: ToastService
    ) {
        this.upcomingBirthdays$ = this.patientService.getAllPatients().pipe(
            map((patients: any[]) => {
                const patientsList = patients || [];
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);

                return patientsList.filter((p: any) => {
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

    getDay(date: string): number {
        if (!date) return 1;
        const parts = date.split('T')[0].split('-');
        if (parts.length === 3) {
            return parseInt(parts[2], 10);
        }
        return new Date(date).getUTCDate(); 
    }

    getMonthName(date: string): string {
        if (!date) return '';
        const parts = date.split('T')[0].split('-');
        if (parts.length === 3) {
            const monthIndex = parseInt(parts[1], 10) - 1;
            const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
            return months[monthIndex] || '';
        }
        return '';
    }

    getAge(date: string): number {
        if (!date) return 0;
        const parts = date.split('T')[0].split('-');
        if (parts.length === 3) {
            const birthYear = parseInt(parts[0], 10);
            const birthMonth = parseInt(parts[1], 10) - 1;
            const birthDay = parseInt(parts[2], 10);
            const today = new Date();
            let age = today.getFullYear() - birthYear;
            const m = today.getMonth() - birthMonth;
            if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
                age--;
            }
            return age;
        }
        return 0;
    }

    sendWish(patient: any): void {
        const firstName = patient.full_name ? patient.full_name.split(' ')[0] : 'Paciente';
        this.toast.success(`Felicitación enviada a ${firstName}!`);
    }
}
