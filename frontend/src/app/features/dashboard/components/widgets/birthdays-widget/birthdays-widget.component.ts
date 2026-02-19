import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { PatientService } from '../../../../../core/services/patient.service';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-birthdays-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatListModule],
    template: `
    <div class="h-full flex flex-col bg-white p-4 overflow-hidden">
        <div class="flex items-center gap-2 mb-3 text-pink-600">
            <mat-icon>cake</mat-icon>
            <h3 class="font-bold text-sm uppercase tracking-wider">Cumpleaños del Mes</h3>
        </div>
        
        <div class="overflow-y-auto flex-1 custom-scrollbar">
            <div *ngIf="(birthdays$ | async)?.length === 0" class="flex flex-col items-center justify-center h-full text-slate-400">
                <mat-icon class="scale-75">event_busy</mat-icon>
                <span class="text-xs">Sin cumpleaños este mes</span>
            </div>

            <ul class="space-y-3">
                <li *ngFor="let p of birthdays$ | async" class="flex items-center gap-3 p-2 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer">
                    <div class="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">
                        {{ getDay(p.date_of_birth) }}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-slate-800 truncate">{{ p.full_name }}</p>
                        <p class="text-xs text-slate-500">{{ getAge(p.date_of_birth) }} años</p>
                    </div>
                    <mat-icon class="text-pink-300 scale-75">card_giftcard</mat-icon>
                </li>
            </ul>
        </div>
    </div>
  `,
    styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
  `]
})
export class BirthdaysWidgetComponent implements OnInit {
    birthdays$;

    constructor(private patientService: PatientService) {
        this.birthdays$ = this.patientService.getPatients().pipe(
            map(response => {
                const patients = response.data;
                const currentMonth = new Date().getMonth();
                return patients.filter(p => {
                    if (!p.date_of_birth) return false;
                    return new Date(p.date_of_birth).getMonth() === currentMonth;
                }).sort((a, b) => {
                    return new Date(a.date_of_birth).getDate() - new Date(b.date_of_birth).getDate();
                });
            })
        );
    }

    ngOnInit() { }

    getDay(date: string): number {
        return new Date(date).getDate();
    }

    getAge(date: string): number {
        const dob = new Date(date);
        const diffMs = Date.now() - dob.getTime();
        const ageDt = new Date(diffMs);
        return Math.abs(ageDt.getUTCFullYear() - 1970);
    }
}
