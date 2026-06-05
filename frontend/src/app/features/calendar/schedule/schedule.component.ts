import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment } from '../../../core/models/appointment.model';
import { AppointmentDialogComponent } from '../../dashboard/components/appointment-dialog/appointment-dialog.component';

// Import date-fns for specialized date handling
import { 
  addMonths, subMonths, addYears, subYears, addDays, subDays, addWeeks, subWeeks,
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, isSameMonth, isToday, startOfYear, endOfYear, eachMonthOfInterval,
  parseISO, isWeekend
} from 'date-fns';
import { es } from 'date-fns/locale';

type CalView = 'year' | 'month' | 'week' | 'day';

interface CalDay { date: Date; isCurrentMonth: boolean; isToday: boolean; appointments: Appointment[]; }
interface MiniMonth { year: number; month: number; days: { date: Date; hasAppt: boolean; isToday: boolean }[]; }

@Component({
    selector: 'app-schedule',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, DatePipe, MatDialogModule],
    styleUrls: ['./schedule.component.scss'],
    templateUrl: './schedule.component.html'
})
export class ScheduleComponent implements OnInit {
    currentView: CalView = 'month';
    currentDate = new Date();
    appointments: Appointment[] = [];
    loading = false;

    previewAppt: Appointment | null = null;
    previewX = 0;
    previewY = 0;
    private previewTimeout: any;

    views = [
        { key: 'year' as CalView, label: 'Año', icon: 'calendar_view_month' },
        { key: 'month' as CalView, label: 'Mes', icon: 'grid_view' },
        { key: 'week' as CalView, label: 'Semana', icon: 'view_week' },
        { key: 'day' as CalView, label: 'Día', icon: 'calendar_today' }
    ];

    hours = Array.from({ length: 17 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);

    // Performance memoization
    monthDays: CalDay[] = [];
    weekDays: Date[] = [];
    yearMonths: MiniMonth[] = [];
    private apptsByDate = new Map<string, Appointment[]>();

    constructor(
        private appointmentService: AppointmentService,
        private dialog: MatDialog,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.refreshCalculatedData(); // Initialize grid immediately so it doesn't start blank
        this.loadAppointments();
    }

    loadAppointments(): void {
        this.loading = true;
        // Load plenty of window to avoid navigation blanks
        const start = startOfMonth(subMonths(this.currentDate, 3));
        const end = endOfMonth(addMonths(this.currentDate, 6));

        this.appointmentService.getAppointments(start, end).subscribe({
            next: data => {
                this.appointments = data;
                this.indexAppointments();
                this.refreshCalculatedData();
                this.loading = false;
                this.cd.markForCheck();
            },
            error: () => { this.loading = false; this.cd.markForCheck(); }
        });
    }

    private indexAppointments(): void {
        this.apptsByDate.clear();
        this.appointments.forEach(a => {
            const d = format(new Date(a.date), 'yyyy-MM-dd');
            if (!this.apptsByDate.has(d)) this.apptsByDate.set(d, []);
            this.apptsByDate.get(d)!.push(a);
        });
    }

    refreshCalculatedData(): void {
        this.monthDays = this.calculateMonthDays();
        this.weekDays = this.calculateWeekDays();
        this.yearMonths = this.calculateYearMonths();
    }

    setView(v: CalView): void { 
        this.currentView = v; 
        this.refreshCalculatedData();
    }

    navigate(dir: number): void {
        if (this.currentView === 'year') {
            this.currentDate = dir > 0 ? addYears(this.currentDate, 1) : subYears(this.currentDate, 1);
        } else if (this.currentView === 'month') {
            this.currentDate = dir > 0 ? addMonths(this.currentDate, 1) : subMonths(this.currentDate, 1);
        } else if (this.currentView === 'week') {
            this.currentDate = dir > 0 ? addWeeks(this.currentDate, 1) : subWeeks(this.currentDate, 1);
        } else { // day view
            this.currentDate = dir > 0 ? addDays(this.currentDate, 1) : subDays(this.currentDate, 1);
        }
        
        this.refreshCalculatedData();
        this.loadAppointments(); 
    }

    goToday(): void { 
        this.currentDate = new Date(); 
        this.refreshCalculatedData();
        this.loadAppointments();
    }

    get periodLabel(): string {
        if (this.currentView === 'year') return format(this.currentDate, 'yyyy');
        if (this.currentView === 'month') return format(this.currentDate, 'MMMM yyyy', { locale: es });
        if (this.currentView === 'week') {
            const s = this.weekDays[0]; const e = this.weekDays[6];
            return `${format(s, 'd')} – ${format(e, 'd MMM yyyy', { locale: es })}`;
        }
        return format(this.currentDate, 'EEEE, d MMMM yyyy', { locale: es });
    }

    // === YEAR ===
    calculateYearMonths(): MiniMonth[] {
        const year = this.currentDate.getFullYear();
        const months = eachMonthOfInterval({
          start: startOfYear(this.currentDate),
          end: endOfYear(this.currentDate)
        });
        return months.map(m => this.buildMiniMonth(year, m.getMonth()));
    }

    buildMiniMonth(year: number, month: number): MiniMonth {
        const monthDate = new Date(year, month, 1);
        const start = startOfWeek(monthDate, { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
        
        const days = eachDayOfInterval({ start, end }).map(date => ({
            date,
            hasAppt: this.apptsByDate.has(format(date, 'yyyy-MM-dd')),
            isToday: isToday(date)
        }));

        return { year, month, days };
    }

    getMonthName(m: number): string {
        return format(new Date(2000, m, 1), 'MMMM', { locale: es });
    }

    // === MONTH ===
    calculateMonthDays(): CalDay[] {
        const monthStart = startOfMonth(this.currentDate);
        const monthEnd = endOfMonth(monthStart);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map(date => ({
            date,
            isCurrentMonth: isSameMonth(date, monthStart),
            isToday: isToday(date),
            appointments: this.getAppointmentsForDay(date)
        }));
    }

    // === WEEK ===
    calculateWeekDays(): Date[] {
        const start = startOfWeek(this.currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(this.currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }

    getAppointmentsForDay(date: Date): Appointment[] {
        return this.apptsByDate.get(format(date, 'yyyy-MM-dd')) || [];
    }

    getApptTop(a: Appointment): number {
        const d = new Date(a.date);
        const h = d.getHours();
        const m = d.getMinutes();
        return ((h - 6) * 60 + m);
    }

    getApptHeight(a: Appointment): number {
        return Math.max(30, (a.durationMinutes || 30));
    }

    isTodayNow(d: Date): boolean { return isToday(d); }
    isWeekendDay(d: Date): boolean { return isWeekend(d); }

    // === INTERACTION ===
    onDayClick(date: Date): void {
        this.currentDate = date;
        this.openNewAppointmentDialog();
    }

    // === PREVIEW ===
    showPreview(appt: Appointment, event: MouseEvent): void {
        clearTimeout(this.previewTimeout);
        const hostRect = document.body.getBoundingClientRect();
        this.previewX = event.clientX - hostRect.left + 12;
        this.previewY = event.clientY - hostRect.top - 20;
        
        if (this.previewX + 280 > window.innerWidth) this.previewX = event.clientX - 300;
        
        this.previewAppt = appt;
        this.cd.markForCheck();
    }

    hidePreview(): void {
        this.previewTimeout = setTimeout(() => {
            this.previewAppt = null;
            this.cd.markForCheck();
        }, 300);
    }

    clearPreviewTimeout(): void {
        clearTimeout(this.previewTimeout);
    }

    getTypeIcon(type: string): string {
        return type === 'emergency' ? 'emergency' : type === 'checkup' ? 'stethoscope' : 'repeat';
    }

    getTypeLabel(type: string): string {
        return type === 'emergency' ? 'Urgencia' : type === 'checkup' ? 'Consulta' : 'Seguimiento';
    }

    // === APPOINTMENT DETAILS ===
    openAppointmentDetail(appt: Appointment): void {
        const dialogRef = this.dialog.open(AppointmentDialogComponent, {
            width: '100vw',
            maxWidth: '500px',
            disableClose: true,
            data: { 
                appointment: appt,
                mode: 'edit'
            },
            panelClass: 'glass-dialog'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === 'deleted' || result === 'updated') {
                this.loadAppointments();
            }
        });
    }

    openNewAppointmentDialog(): void {
        const dialogRef = this.dialog.open(AppointmentDialogComponent, {
            width: '100vw',
            maxWidth: '500px',
            disableClose: true,
            data: { 
                date: this.currentDate,
                mode: 'create'
            },
            panelClass: 'glass-dialog'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // If the dialog returns a new appointment object, we handle it here
                // or if it already saved it via service, we just refresh
                this.loadAppointments();
            }
        });
    }
}
