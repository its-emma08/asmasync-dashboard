import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Intervention } from '../models/intervention.model';

@Injectable({
    providedIn: 'root'
})
export class InterventionService {
    private apiUrl = `${environment.apiUrl}/interventions`;

    constructor(private http: HttpClient) { }

    // Crear nueva intervención
    createIntervention(data: Intervention): Observable<Intervention> {
        return this.http.post<Intervention>(this.apiUrl, data);
    }

    // Obtener intervenciones por paciente
    getInterventionsByPatient(patientId: number): Observable<Intervention[]> {
        return this.http.get<Intervention[]>(`${this.apiUrl}/${patientId}`);
    }

    // Editar intervención
    updateIntervention(id: number, data: Intervention): Observable<Intervention> {
        return this.http.put<Intervention>(`${this.apiUrl}/${id}`, data);
    }

    // Eliminar intervención
    deleteIntervention(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
