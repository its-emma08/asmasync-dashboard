import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface EmergencyContact {
  id: number;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_primary: boolean;
}

export interface EmergencyContactCreate {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_primary?: boolean;
}

@Injectable({ providedIn: 'root' })
export class EmergencyContactService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/emergency-contacts`;

  getAll(): Observable<EmergencyContact[]> {
    return this.http.get<EmergencyContact[]>(this.BASE).pipe(
      catchError(() => of([]))
    );
  }

  create(data: EmergencyContactCreate): Observable<EmergencyContact> {
    return this.http.post<EmergencyContact>(this.BASE, data);
  }

  update(id: number, data: Partial<EmergencyContactCreate>): Observable<EmergencyContact> {
    return this.http.put<EmergencyContact>(`${this.BASE}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }
}
