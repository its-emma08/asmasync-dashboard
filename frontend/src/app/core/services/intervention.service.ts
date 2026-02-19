import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Intervention } from '../models/intervention.model';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class InterventionService {
    private apiUrl = `${environment.apiUrl}/interventions`;

    private interventions: Intervention[] = [];

    constructor(private http: HttpClient, private storageService: StorageService) {
        this.loadInitialData();
    }

    private loadInitialData(): void {
        const stored = this.storageService.getItem('asmasync_interventions');
        if (stored) {
            this.interventions = stored;
        } else {
            // Initialize with empty or some mock if needed
            this.interventions = [];
        }
    }

    private saveToStorage(): void {
        this.storageService.setItem('asmasync_interventions', this.interventions);
    }

    // Crear nueva intervención
    createIntervention(data: Intervention): Observable<Intervention> {
        // En modo mock/offline, guardamos localmente
        const newIntervention = { ...data, id: this.interventions.length + 1 };
        this.interventions.unshift(newIntervention);
        this.saveToStorage();
        return of(newIntervention);
        // return this.http.post<Intervention>(this.apiUrl, data); // Original
    }

    // Obtener intervenciones por paciente
    getInterventionsByPatient(patientId: number | string): Observable<Intervention[]> {
        // Return local data filtered by patient
        const patientInterventions = this.interventions.filter(i => i.patientId == patientId);
        return of(patientInterventions);

        /* Original HTTP logic
        return this.http.get<Intervention[]>(`${this.apiUrl}/${patientId}`).pipe(
            catchError(err => {
                console.warn('Backend unavailable, returning MOCK INTERVENTIONS');
                return of([]);
            })
        );
        */
    }

    // Editar intervención
    updateIntervention(id: number | string, data: Intervention): Observable<Intervention> {
        const index = this.interventions.findIndex(i => i.id == id);
        if (index !== -1) {
            this.interventions[index] = { ...this.interventions[index], ...data };
            this.saveToStorage();
            return of(this.interventions[index]);
        }
        return of(data);
        // return this.http.put<Intervention>(`${this.apiUrl}/${id}`, data);
    }

    // Eliminar intervención
    deleteIntervention(id: number | string): Observable<void> {
        this.interventions = this.interventions.filter(i => i.id != id);
        this.saveToStorage();
        return of(void 0);
        // return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
