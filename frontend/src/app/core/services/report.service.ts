import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PdfExportService } from './pdf-export.service';

export interface PatientReport {
    generated_at: string;
    period: { start: string; end: string };
    doctor: { id: number; full_name: string; email: string };
    patient: { id: number; full_name: string; email: string; [key: string]: any };
    summary: {
        total_measurements: number;
        total_predictions: number;
        total_interventions: number;
        total_appointments: number;
        latest_risk: string | null;
    };
    measurements: any[];
    predictions: any[];
    interventions: any[];
    action_plan: any;
    medications: any[];
    appointments: any[];
}

@Injectable({ providedIn: 'root' })
export class ReportService {
    private http = inject(HttpClient);
    private pdfExport = inject(PdfExportService);
    private readonly BASE = `${environment.apiUrl}/reports`;

    getPatientReport(patientId: number, startDate?: string, endDate?: string): Observable<PatientReport> {
        let params = new HttpParams();
        if (startDate) params = params.set('start_date', startDate);
        if (endDate) params = params.set('end_date', endDate);
        return this.http.get<PatientReport>(`${this.BASE}/patient/${patientId}`, { params });
    }

    getSummaryReport(): Observable<any> {
        return this.http.get<any>(`${this.BASE}/summary`);
    }

    async downloadPatientReport(patientId: number, patientName: string, startDate?: string, endDate?: string): Promise<void> {
        const report = await firstValueFrom(this.getPatientReport(patientId, startDate, endDate));
        if (!report) return;

        const riskColors: Record<string, string> = {
            low: '#16a34a', moderate: '#d97706', high: '#dc2626', unknown: '#6b7280'
        };
        const riskLabels: Record<string, string> = {
            low: 'Bajo', moderate: 'Moderado', high: 'Alto', unknown: 'Sin datos'
        };

        const html = `
            <style>
                body { font-family: 'Inter', sans-serif; color: #1e293b; }
                h1 { color: #0f172a; font-size: 20px; margin-bottom: 4px; }
                h2 { color: #334155; font-size: 14px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; }
                .meta { color: #64748b; font-size: 11px; margin-bottom: 16px; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
                .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
                .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                .value { font-size: 16px; font-weight: 700; color: #0f172a; }
                .risk { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; color: white; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
                th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-weight: 600; color: #475569; }
                td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
                .section { margin-bottom: 20px; }
                .zone-box { padding: 8px 12px; border-radius: 6px; margin: 4px 0; font-size: 12px; }
                .green-box { background: #f0fdf4; border-left: 4px solid #16a34a; }
                .yellow-box { background: #fffbeb; border-left: 4px solid #d97706; }
                .red-box { background: #fef2f2; border-left: 4px solid #dc2626; }
            </style>

            <h1>Reporte Clínico — ${report.patient.full_name}</h1>
            <div class="meta">
                Generado: ${new Date(report.generated_at).toLocaleString('es-MX')} &nbsp;|&nbsp;
                Período: ${report.period.start} al ${report.period.end} &nbsp;|&nbsp;
                Doctor: ${report.doctor.full_name}
            </div>

            <h2>Resumen del período</h2>
            <div class="grid">
                <div class="card">
                    <div class="label">Mediciones</div>
                    <div class="value">${report.summary.total_measurements}</div>
                </div>
                <div class="card">
                    <div class="label">Predicciones</div>
                    <div class="value">${report.summary.total_predictions}</div>
                </div>
                <div class="card">
                    <div class="label">Intervenciones</div>
                    <div class="value">${report.summary.total_interventions}</div>
                </div>
                <div class="card">
                    <div class="label">Citas</div>
                    <div class="value">${report.summary.total_appointments}</div>
                </div>
            </div>
            ${report.summary.latest_risk ? `
            <p>Último nivel de riesgo:
                <span class="risk" style="background:${riskColors[report.summary.latest_risk] || '#6b7280'}">
                    ${riskLabels[report.summary.latest_risk] || report.summary.latest_risk}
                </span>
            </p>` : ''}

            ${report.action_plan ? `
            <h2>Plan de acción</h2>
            <div class="section">
                <strong>${report.action_plan.plan_name}</strong>
                ${report.action_plan.green_zone_instructions ? `
                    <div class="zone-box green-box"><strong>Zona Verde (PEF ≥ 80%):</strong> ${report.action_plan.green_zone_instructions}</div>` : ''}
                ${report.action_plan.yellow_zone_instructions ? `
                    <div class="zone-box yellow-box"><strong>Zona Amarilla (PEF 50–79%):</strong> ${report.action_plan.yellow_zone_instructions}</div>` : ''}
                ${report.action_plan.red_zone_instructions ? `
                    <div class="zone-box red-box"><strong>Zona Roja (PEF &lt; 50%):</strong> ${report.action_plan.red_zone_instructions}</div>` : ''}
                ${report.action_plan.emergency_contact ? `<p style="font-size:12px">Contacto de emergencia: <strong>${report.action_plan.emergency_contact}</strong></p>` : ''}
            </div>` : ''}

            ${report.medications.length > 0 ? `
            <h2>Medicamentos activos</h2>
            <table>
                <tr><th>Nombre</th><th>Dosis</th><th>Frecuencia</th></tr>
                ${report.medications.map(m => `<tr><td>${m.name}</td><td>${m.dosage || '—'}</td><td>${m.frequency_hours ? m.frequency_hours + 'h' : '—'}</td></tr>`).join('')}
            </table>` : ''}

            ${report.interventions.length > 0 ? `
            <h2>Intervenciones (${report.interventions.length})</h2>
            <table>
                <tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Próx. seguimiento</th></tr>
                ${report.interventions.map(i => `
                <tr>
                    <td>${i.created_at ? new Date(i.created_at).toLocaleDateString('es-MX') : '—'}</td>
                    <td>${i.type}</td>
                    <td>${i.description}</td>
                    <td>${i.next_follow_up || '—'}</td>
                </tr>`).join('')}
            </table>` : ''}

            ${report.measurements.length > 0 ? `
            <h2>Mediciones (${report.measurements.length})</h2>
            <table>
                <tr><th>Fecha</th><th>PEF</th><th>SpO₂</th><th>FC</th></tr>
                ${report.measurements.slice(0, 20).map(m => `
                <tr>
                    <td>${m.recorded_at ? new Date(m.recorded_at).toLocaleDateString('es-MX') : '—'}</td>
                    <td>${m.pef ?? '—'}</td>
                    <td>${m.oxygen_saturation ?? '—'}${m.oxygen_saturation ? '%' : ''}</td>
                    <td>${m.heart_rate ?? '—'}</td>
                </tr>`).join('')}
                ${report.measurements.length > 20 ? `<tr><td colspan="4" style="color:#94a3b8;text-align:center">... ${report.measurements.length - 20} más</td></tr>` : ''}
            </table>` : ''}

            ${report.appointments.length > 0 ? `
            <h2>Citas (${report.appointments.length})</h2>
            <table>
                <tr><th>Fecha</th><th>Tipo</th><th>Duración</th><th>Estado</th></tr>
                ${report.appointments.map(a => `
                <tr>
                    <td>${a.date ? new Date(a.date).toLocaleString('es-MX') : '—'}</td>
                    <td>${a.type || '—'}</td>
                    <td>${a.duration_minutes ?? 30} min</td>
                    <td>${a.status}</td>
                </tr>`).join('')}
            </table>` : ''}
        `;

        const dateStr = new Date().toISOString().split('T')[0];
        await this.pdfExport.exportFromHtml(html, {
            filename: `Reporte_AsmaSync_${this.pdfExport.sanitizeName(patientName)}_${dateStr}.pdf`,
            paperSize: 'letter'
        });
    }
}
