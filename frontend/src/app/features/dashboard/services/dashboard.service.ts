import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { StorageService } from '../../../core/services/storage.service';

export interface DashboardWidget {
    id: string;
    type: 'kpi-group' | 'alerts-panel' | 'patients-table' | 'trend-chart' | 'activity-list' | 'weather' | 'calendar' | 'quick-actions' | 'medication' | 'device-status' | 'act-score' | 'single-kpi' | 'birthdays' | 'reminders' | 'shortcuts';
    colSpan: number; // 1 to 12
    rowSpan?: number;
    title: string;
    config?: any;
}

// Grid System: 4 Columns Total
// 4 = Full Width (100%)
// 3 = Large (75%)
// 2 = Half (50%)
// 1 = Small (25%)

const DEFAULT_LAYOUT: DashboardWidget[] = [
    // Row 1: Vital Stats (Top visibility)
    { id: 'w_kpi', type: 'kpi-group', colSpan: 4, rowSpan: 1, title: 'Resumen Clínico' },

    // Row 2: Trends & Alerts (The "Pulse")
    { id: 'w_trend', type: 'trend-chart', colSpan: 3, rowSpan: 2, title: 'Tendencia de PEF (Última Semana)' },
    { id: 'w_alerts', type: 'alerts-panel', colSpan: 1, rowSpan: 2, title: 'Alertas Activas' },

    // Row 3: Patient Management
    { id: 'w_patients', type: 'patients-table', colSpan: 4, rowSpan: 2, title: 'Pacientes Prioritarios' },

    // Row 4: Utilities
    { id: 'w_actions', type: 'quick-actions', colSpan: 1, rowSpan: 1, title: 'Accesos Directos' },
    { id: 'w_weather', type: 'weather', colSpan: 1, rowSpan: 1, title: 'Ambiente' },
    { id: 'w_calendar', type: 'calendar', colSpan: 2, rowSpan: 1, title: 'Agenda del Día' }
];



@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private widgetsSubject = new BehaviorSubject<DashboardWidget[]>(DEFAULT_LAYOUT);
    widgets$ = this.widgetsSubject.asObservable();

    private editModeSubject = new BehaviorSubject<boolean>(false);
    editMode$ = this.editModeSubject.asObservable();

    constructor(private storageService: StorageService) {
        this.loadLayout();
    }

    toggleEditMode(): void {
        this.editModeSubject.next(!this.editModeSubject.value);
    }

    getEditMode(): boolean {
        return this.editModeSubject.value;
    }

    addWidget(type: DashboardWidget['type'] | string, subType?: string): void {
        const current = this.widgetsSubject.value;

        // Smart Defaults for Grid (4 col total)
        let defaultColSpan = 1; // Default to 1/4 width (Small)
        let defaultRowSpan = 1;
        let title = 'Widget';
        let config = {};

        switch (type) {
            case 'kpi-group': defaultColSpan = 4; break; // Full
            case 'trend-chart': defaultColSpan = 3; break; // Large

            case 'patients-table': defaultColSpan = 3; defaultRowSpan = 2; break; // Large Table
            case 'alerts-panel': defaultColSpan = 1; break; // Sidebar

            case 'medication': defaultColSpan = 1; break;
            case 'act-score': defaultColSpan = 1; break;
            case 'device-status': defaultColSpan = 1; break;
            case 'weather': defaultColSpan = 1; break;
            case 'activity-list': defaultColSpan = 2; break; // Medium
            case 'quick-actions': defaultColSpan = 1; break;

            case 'single-kpi':
                defaultColSpan = 1;
                if (subType === 'total') {
                    title = 'Total Pacientes';
                    config = { icon: 'groups', color: 'blue', value: 20, label: 'Pacientes', trend: '+12%' };
                } else if (subType === 'active') {
                    title = 'Pacientes Activos';
                    config = { icon: 'person_check', color: 'green', value: 18, label: 'Activos', trend: '+5%' };
                } else if (subType === 'risk') {
                    title = 'Alto Riesgo';
                    config = { icon: 'warning', color: 'red', value: 3, label: 'Riesgo', trend: '-2%' };
                } else if (subType === 'controlled') {
                    title = 'Controlados';
                    config = { icon: 'thumb_up', color: 'cyan', value: 15, label: 'Controlados', trend: '+8%' };
                }
                break;
            case 'birthdays': defaultColSpan = 1; break;
            case 'reminders': defaultColSpan = 1; break;
            case 'shortcuts': defaultColSpan = 1; break;
        }

        const newWidget: DashboardWidget = {
            id: `w_${Date.now()}`,
            type: type as any,
            colSpan: defaultColSpan,
            rowSpan: defaultRowSpan,
            title: title !== 'Widget' ? title : this.getTitleForType(type),
            config: config
        };
        this.saveLayout([...current, newWidget]);
    }

    removeWidget(id: string): void {
        const current = this.widgetsSubject.value;
        this.saveLayout(current.filter(w => w.id !== id));
    }

    toggleWidgetSize(id: string): void {
        const current = this.widgetsSubject.value.map(w => {
            if (w.id === id) {
                // Cycle: 1 -> 2 -> 3 -> 4 -> 1
                let newCol = w.colSpan + 1;
                if (newCol > 4) newCol = 1;

                return { ...w, colSpan: newCol };
            }
            return w;
        });
        this.saveLayout(current);
    }

    updateWidgetColSpan(id: string, colSpan: number): void {
        this.updateWidgetSize(id, colSpan);
    }

    updateWidgetSize(id: string, colSpan: number, rowSpan?: number): void {
        const current = this.widgetsSubject.value.map(w => {
            if (w.id === id) {
                const newCol = Math.max(1, Math.min(4, colSpan));
                const newRow = rowSpan ? Math.max(1, rowSpan) : (w.rowSpan || 1);
                return { ...w, colSpan: newCol, rowSpan: newRow };
            }
            return w;
        });
        this.saveLayout(current);
    }

    reorderWidgets(previousIndex: number, currentIndex: number): void {
        const current = [...this.widgetsSubject.value];
        moveItemInArray(current, previousIndex, currentIndex);
        this.saveLayout(current);
    }

    resetLayout(): void {
        // Clear storage to force default reload
        this.storageService.removeItem('asmasync_dashboard_layout');
        this.widgetsSubject.next(DEFAULT_LAYOUT);
    }

    private loadLayout(): void {
        const stored = this.storageService.getItem('asmasync_dashboard_layout');
        if (stored) {
            this.widgetsSubject.next(stored);
        } else {
            this.widgetsSubject.next(DEFAULT_LAYOUT);
        }
    }

    private saveLayout(widgets: DashboardWidget[]): void {
        this.widgetsSubject.next(widgets);
        this.storageService.setItem('asmasync_dashboard_layout', widgets);
    }

    private getTitleForType(type: string): string {
        switch (type) {
            case 'kpi-group': return 'Indicadores Clave';
            case 'alerts-panel': return 'Alertas';
            case 'patients-table': return 'Pacientes';
            case 'trend-chart': return 'Tendencia';
            case 'activity-list': return 'Actividad';
            case 'weather': return 'Calidad del Aire';
            case 'calendar': return 'Agenda';
            case 'quick-actions': return 'Acciones Rápidas';
            case 'single-kpi': return 'KPI Individual';
            case 'birthdays': return 'Cumpleaños';
            case 'reminders': return 'Notas';
            case 'shortcuts': return 'Atajos de Personal';
            default: return 'Widget';
        }
    }
    // --- Calendar / Appointments State (Phase 11) ---
    private appointmentsSubject = new BehaviorSubject<any[]>([
        {
            month: 'FEB', day: '14',
            title: 'Consulta: Emmanuel Peña',
            time: '09:00 AM - 09:30 AM',
            colorClass: 'bg-indigo-50 text-indigo-600'
        },
        {
            month: 'FEB', day: '14',
            title: 'Revisión: Ana García',
            time: '11:15 AM - 11:45 AM',
            colorClass: 'bg-emerald-50 text-emerald-600'
        },
        {
            month: 'FEB', day: '14',
            title: 'Espirometría: Carlos R.',
            time: '01:30 PM - 02:00 PM',
            colorClass: 'bg-orange-50 text-orange-600'
        }
    ]);
    appointments$ = this.appointmentsSubject.asObservable();

    addAppointment(apt: any): void {
        const current = this.appointmentsSubject.value;
        this.appointmentsSubject.next([apt, ...current]);
    }
}
