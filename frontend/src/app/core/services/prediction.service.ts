import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PredictionRequest {
  patient_id?: number;
  pef?: number;
  fev1?: number;
  spo2?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  symptom_score?: number;
}

export interface PredictionResponse {
  id: number;
  user_id?: number;
  risk_level: string;
  probability?: number;
  input_data?: {
    factors?: string[];
    recommendation?: string;
    [key: string]: any;
  };
  predicted_at?: string;
  model_version?: string;
  
  // Legacy or mockup compatibility
  risk_score?: number;
  confidence?: number;
  factors?: string[];
  recommendation?: string;
  created_at?: string;
}

export interface PaginatedPredictions {
  data: PredictionResponse[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class PredictionService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/predictions`;

  predict(data: PredictionRequest): Observable<PredictionResponse> {
    return this.http.post<PredictionResponse>(this.BASE, data);
  }

  getAll(page = 1, limit = 10): Observable<PaginatedPredictions> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedPredictions>(this.BASE, { params }).pipe(
      catchError(() => of({ data: [], total: 0, page: 1, limit }))
    );
  }

  getLatest(): Observable<PredictionResponse | null> {
    return this.http.get<PredictionResponse>(`${this.BASE}/latest`).pipe(
      catchError(() => of(null))
    );
  }

  getPatientPredictions(patientId: number, limit = 10): Observable<PredictionResponse[]> {
    const parentBase = this.BASE.substring(0, this.BASE.lastIndexOf('/'));
    return this.http.get<PredictionResponse[]>(`${parentBase}/patients/${patientId}/predictions?limit=${limit}`).pipe(
      catchError(() => of([]))
    );
  }
}
