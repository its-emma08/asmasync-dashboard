import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment } from '../../../core/models/appointment.model';

@Component({
    selector: 'app-schedule',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatTabsModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatChipsModule
    ],
    templateUrl: './schedule.component.html',
    styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit {
    currentDate: Date = new Date();
    weekDays: Date[] = [];
    appointments: Appointment[] = [];
    loading = false;
    view: 'week' | 'day' = 'week';

    constructor(private appointmentService: AppointmentService) { }

    ngOnInit(): void {
        this.generateWeekDays();
        this.loadAppointments();
    }

    generateWeekDays(): void {
        const startOfWeek = this.getStartOfWeek(this.currentDate);
        this.weekDays = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            this.weekDays.push(day);
        }
    }

    getStartOfWeek(date: Date): Date {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(date.setDate(diff));
    }

    loadAppointments(): void {
        this.loading = true;
        const start = this.weekDays[0];
        const end = this.weekDays[6];

        // Mock API call needs real dates
        this.appointmentService.getAppointments(start, end).subscribe({
            next: (data) => {
                this.appointments = data;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    getAppointmentsForDay(date: Date): Appointment[] {
        return this.appointments.filter(a =>
            new Date(a.date).toDateString() === date.toDateString()
        );
    }

    changeWeek(offset: number): void {
        const newDate = new Date(this.currentDate);
        newDate.setDate(newDate.getDate() + (offset * 7));
        this.currentDate = newDate;
        this.generateWeekDays();
        this.loadAppointments();
    }

    isToday(date: Date): boolean {
        return date.toDateString() === new Date().toDateString();
    }

    getTypeColor(type: string): string {
        switch (type) {
            case 'checkup': return 'bg-blue-100 text-blue-700';
            case 'emergency': return 'bg-red-100 text-red-700';
            case 'follow_up': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }
}
