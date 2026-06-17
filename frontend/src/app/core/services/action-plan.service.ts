import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ActionPlanStep {
    id?: number;
    action_plan_id?: number;
    zone: 'green' | 'yellow' | 'red';
    step_order: number;
    step_title: string;
    step_description?: string;
    is_critical?: boolean;
    created_at?: string;
}

export interface ActionPlan {
    id?: number;
    user_id?: number;
    plan_name: string;
    green_zone_instructions?: string;
    yellow_zone_instructions?: string;
    red_zone_instructions?: string;
    emergency_contact?: string;
    is_active?: boolean;
    steps?: ActionPlanStep[];
    created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ActionPlanService {
    private http = inject(HttpClient);
    private readonly BASE = `${environment.apiUrl}/action-plans`;

    /** Plan propio del usuario autenticado (mobile) */
    get(): Observable<ActionPlan | null> {
        return this.http.get<ActionPlan>(this.BASE).pipe(
            catchError(() => of(null))
        );
    }

    /** Crea o reemplaza el plan propio */
    save(data: Partial<ActionPlan>): Observable<ActionPlan> {
        return this.http.post<ActionPlan>(this.BASE, data);
    }

    /** Pasos del plan propio, opcionalmente filtrados por zona */
    getSteps(zone?: 'green' | 'yellow' | 'red'): Observable<ActionPlanStep[]> {
        const params: any = {};
        if (zone) params['zone'] = zone;
        return this.http.get<ActionPlanStep[]>(`${this.BASE}/steps`, { params }).pipe(
            catchError(() => of([]))
        );
    }

    addStep(step: Omit<ActionPlanStep, 'id' | 'action_plan_id' | 'created_at'>): Observable<ActionPlanStep> {
        return this.http.post<ActionPlanStep>(`${this.BASE}/steps`, step);
    }

    /** Plan de acción de un paciente (doctor) */
    getForPatient(patientId: number): Observable<{ plan: ActionPlan | null; steps: ActionPlanStep[] }> {
        return this.http.get<{ plan: ActionPlan | null; steps: ActionPlanStep[] }>(
            `${environment.apiUrl}/patients/${patientId}/action-plan`
        ).pipe(
            catchError(() => of({ plan: null, steps: [] }))
        );
    }

    /** Reemplaza el plan de acción de un paciente (doctor) */
    updateForPatient(patientId: number, data: Partial<ActionPlan>): Observable<any> {
        return this.http.put<any>(
            `${environment.apiUrl}/patients/${patientId}/action-plan`,
            data
        );
    }
}
