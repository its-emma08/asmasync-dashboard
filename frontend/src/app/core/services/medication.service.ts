import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  route?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  is_active: boolean;
  last_taken_at?: string;
}

export interface MedicationCreate {
  name: string;
  dosage: string;
  frequency: string;
  route?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface MedicationUpdate extends Partial<MedicationCreate> {
  is_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MedicationService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/medications`;

  getAll(): Observable<Medication[]> {
    return this.http.get<Medication[]>(this.BASE).pipe(
      catchError(() => of([]))
    );
  }

  create(data: MedicationCreate): Observable<Medication> {
    return this.http.post<Medication>(this.BASE, data);
  }

  update(id: number, data: MedicationUpdate): Observable<Medication> {
    return this.http.patch<Medication>(`${this.BASE}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  markTaken(id: number): Observable<any> {
    return this.http.post<any>(`${this.BASE}/${id}/take`, {});
  }
}
