import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { StorageService } from '../../../core/services/storage.service';
import { WidgetSize } from '../components/widget-shell/widget-shell.component';

export interface DashboardWidget {
    id: string;
    type: 'kpi-group' | 'alerts-panel' | 'patients-table' | 'trend-chart' | 'activity-list' | 'weather' | 'calendar' | 'quick-actions' | 'medication' | 'device-status' | 'act-score' | 'single-kpi' | 'birthdays' | 'reminders' | 'shortcuts';
    size: WidgetSize;
    title: string;
    config?: any;
}

// Bump this version when DEFAULT_LAYOUT changes to auto-reset stale localStorage layouts
const LAYOUT_VERSION = 6;

// Layout Default - Bento 4 columnas sin espacios vacíos
const DEFAULT_LAYOUT: DashboardWidget[] = [
    // Fila 1: KPIs ancho completo
    { id: 'w_kpi', type: 'kpi-group', size: 'full', title: 'Resumen Clínico' },

    // Fila 2: Acciones (2) + Clima (1) = 3 columnas, pero en grid 2D fluye junto a tendencia/alertas
    { id: 'w_actions', type: 'quick-actions', size: 'medium', title: 'Acciones Rápidas' },
    { id: 'w_weather', type: 'weather', size: 'small', title: 'Ambiente' },
    { id: 'w_trend', type: 'trend-chart', size: 'large', title: 'Flujo Respiratorio' },

    // Filas 3-4: Alertas large (2 cols, 2 filas) + Agenda large (2 cols, 2 filas) = 4 columnas ✓
    { id: 'w_alerts', type: 'alerts-panel', size: 'large', title: 'Alertas Clínicas' },
    { id: 'w_calendar', type: 'calendar', size: 'large', title: 'Agenda del Día' },

    // Fila 5: Pacientes ancho completo y alto doble
    { id: 'w_patients', type: 'patients-table', size: 'full-large', title: 'Pacientes Prioritarios' },
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
        let defaultSize: WidgetSize = 'small';
        let title = 'Widget';
        let config = {};

        switch (type) {
            case 'kpi-group': defaultSize = 'full'; break;
            case 'trend-chart': defaultSize = 'large'; break;
            case 'patients-table': defaultSize = 'full-large'; break;
            case 'alerts-panel': defaultSize = 'large'; break;
            case 'medication': defaultSize = 'small'; break;
            case 'act-score': defaultSize = 'small'; break;
            case 'device-status': defaultSize = 'small'; break;
            case 'weather': defaultSize = 'small'; break;
            case 'activity-list': defaultSize = 'large'; break;
            case 'quick-actions': defaultSize = 'medium'; break;
            case 'calendar': defaultSize = 'large'; break;

            case 'single-kpi':
                defaultSize = 'small';
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
            case 'birthdays': defaultSize = 'small'; break;
            case 'reminders': defaultSize = 'small'; break;
            case 'shortcuts': defaultSize = 'small'; break;
        }

        const newWidget: DashboardWidget = {
            id: `w_${Date.now()}`,
            type: type as any,
            size: defaultSize,
            title: title !== 'Widget' ? title : this.getTitleForType(type),
            config: config
        };
        this.saveLayout([...current, newWidget]);
    }

    removeWidget(id: string): void {
        const current = this.widgetsSubject.value;
        this.saveLayout(current.filter(w => w.id !== id));
    }

    updateWidgetSize(id: string, newSize: WidgetSize): void {
        const current = this.widgetsSubject.value.map(w => {
            if (w.id === id) {
                return { ...w, size: newSize };
            }
            return w;
        });
        this.saveLayout(current);
    }

    reorderWidgets(previousIndex: number, currentIndex: number): void {
        const current = [...this.widgetsSubject.value];
        moveItemInArray(current, previousIndex, currentIndex);
        this.widgetsSubject.next(current);
        this.saveLayout(current);
    }

    resetLayout(): void {
        this.storageService.removeItem('asmasync_dashboard_layout');
        this.widgetsSubject.next(DEFAULT_LAYOUT);
    }

    private loadLayout(): void {
        const storedVersion = this.storageService.getItem('asmasync_dashboard_layout_version') as number | null;
        const stored = this.storageService.getItem('asmasync_dashboard_layout');

        // Reset if no stored layout or version is outdated
        if (!stored || (storedVersion ?? 0) < LAYOUT_VERSION) {
            this.storageService.setItem('asmasync_dashboard_layout_version', LAYOUT_VERSION);
            this.saveLayout(DEFAULT_LAYOUT);
            return;
        }

        // Migrate legacy colSpan/rowSpan to size string if needed
        let migrated = false;
        const unified = (stored as any[]).map(w => {
            if (w.colSpan !== undefined && !w.size) {
                migrated = true;
                return {
                    id: w.id, type: w.type, title: w.title, config: w.config,
                    size: this.mapLegacyToNewSize(w.colSpan, w.rowSpan || 1)
                } as DashboardWidget;
            }
            return w;
        });

        if (migrated) {
            this.saveLayout(unified);
        } else {
            this.widgetsSubject.next(stored);
        }
    }

    private mapLegacyToNewSize(col: number, row: number): WidgetSize {
        if (col >= 10 || col === 4) return 'full'; // Assuming legacy 12-col mapping or 4
        if (col >= 8 || col === 3) return 'wide';
        if (col >= 6 || col === 2) {
             if (row >= 2) return 'large';
             return 'medium';
        }
        if (row >= 2) return 'tall';
        return 'small';
    }

    private saveLayout(widgets: DashboardWidget[]): void {
        this.widgetsSubject.next(widgets);
        this.storageService.setItem('asmasync_dashboard_layout', widgets);
    }

    private getTitleForType(type: string): string {
        switch (type) {
            case 'kpi-group': return 'Indicadores Clave';
            case 'alerts-panel': return 'Análisis de Riesgo Clínico';
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
}
