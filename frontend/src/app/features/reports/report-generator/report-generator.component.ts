import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { QRCodeComponent } from 'angularx-qrcode';

import { PatientService } from '../../../core/services/patient.service';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { Patient, PEFTrend } from '../../../core/models/patient.model';
import { PdfExportService } from '../../../core/services/pdf-export.service';
import * as riskHelper from '../../../core/utils/risk.helper';

import Chart from 'chart.js/auto';

interface ReportConfig {
    patientId: string | number | null;
    title: string;
    institutionName: string;
    primaryColor: string;
    accentColor: string;
    showWatermark: boolean;
    showHeader: boolean;
    showFooter: boolean;
    paperSize: 'letter' | 'a4' | 'legal'; // New: Paper Size
    evolutionNotes: string; // New: Specific note for report
    recommendations: string; // New: Recommendations
    customFolio: string; // New: Custom Folio
    sections: {
        id: string;
        label: string;
        enabled: boolean;
        order: number;
    }[];
}

@Component({
    selector: 'app-report-generator',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DragDropModule,
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatCheckboxModule,
        MatTooltipModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatSlideToggleModule,
        MatButtonToggleModule,
        MatTabsModule,
        MatDividerModule,
        MatChipsModule,
        QRCodeComponent
    ],
    templateUrl: './report-generator.component.html',
    styleUrls: ['./report-generator.component.scss']
})
export class ReportGeneratorComponent implements OnInit, OnDestroy {
    @ViewChild('reportContent') reportContent!: ElementRef;

    today = new Date();
    patients: Patient[] = [];
    selectedPatient: Patient | null = null;
    private destroy$ = new Subject<void>();

    // New: Edited Patient (In-Situ Editing)
    editedPatient: any = {};
    hasPatients: boolean = false;

    pefTrend: PEFTrend[] = [];

    isLoadingPatients = false;
    isGenerating = false;
    isExportingWeekly = false;
    institutionLogo: string | null = null;

    doctorName = 'Usuario';
    doctorSpecialty = 'Especialista';

    // Weekly export state
    activePeriod: 'week' | 'month' | 'custom' = 'week';
    weeklyFrom: string = '';
    weeklyTo: string = '';
    weeklySummaryStats: { total_patients: number, risk_distribution: { low: number, high: number } } | null = null;

    // Default Configuration
    config: ReportConfig = {
        patientId: null,
        title: 'Informe Clínico de Evolución',
        institutionName: 'AsmaSync Medical Center',
        primaryColor: '#0E7490', // Cyan-700
        accentColor: '#06B6D4', // Cyan-500
        showWatermark: true,
        showHeader: true,
        showFooter: true,
        paperSize: 'letter', // Default to Letter (common in LatAm)
        evolutionNotes: 'Paciente acude a valoración mensual. Refiere buena tolerancia al tratamiento actual.\nNo ha presentado crisis en las últimas 4 semanas.\nLa técnica de inhalación es correcta.',
        recommendations: 'Continuar con esquema actual.\nRealizar espirometría de control en 3 meses.\nEvitar exposición a alérgenos conocidos (polvo, polen).',
        customFolio: '',
        sections: [
            { id: 'identification', label: 'Ficha de Identificación', enabled: true, order: 0 },
            { id: 'vitals', label: 'Signos Vitales y Métricas', enabled: true, order: 1 },
            { id: 'charts', label: 'Gráfica de Evolución (FEM)', enabled: true, order: 2 },
            { id: 'medications', label: 'Esquema de Medicamentación', enabled: true, order: 3 },
            { id: 'action_plan', label: 'Plan de Acción (Zonas)', enabled: true, order: 4 },
            { id: 'notes', label: 'Notas de Evolución', enabled: true, order: 5 },
            { id: 'recommendations', label: 'Recomendaciones', enabled: true, order: 6 },
            { id: 'signatures', label: 'Firmas', enabled: true, order: 7 }
        ]
    };

    // UI helpers
    activeSectionTab = 0;
    generatedPDF: Blob | null = null;
    chartInstance: Chart<'line', number[], string | Date> | null = null;
    chartImageSrc: string | null = null;

    constructor(
        private patientService: PatientService,
        public authService: AuthService,
        private snackBar: MatSnackBar,
        private cd: ChangeDetectorRef,
        private storageService: StorageService,
        private pdfExport: PdfExportService
    ) { }

    get currentDoctorName(): string {
        return this.doctorName;
    }

    get qrData(): string {
        if (!this.editedPatient) return 'AsmaSync Medical Center';
        return `AsmaSync | Paciente: ${this.editedPatient.full_name} | ID: ${this.editedPatient.id} | Riesgo: ${this.editedPatient.riskLevel}`;
    }

    ngOnInit(): void {
        this.loadSettings();
        this.loadPatients();
        this.setPeriod('week'); // defaults

        this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
            if (user) {
                this.doctorName = user.full_name || 'Usuario';
                this.doctorSpecialty = (user as any).specialty || 'Especialista';
                // Only override institutionName if the user hasn't customised it
                if (this.config.institutionName === 'AsmaSync Medical Center' && (user as any).hospital_name) {
                    this.config.institutionName = (user as any).hospital_name;
                }
            }
        });
    }

    loadSettings(): void {
        const stored = this.storageService.getItem('asmasync_report_settings');
        if (stored) {
            try {
                this.config = { ...this.config, ...stored };
            } catch (e) {
                console.error('Error loading report settings', e);
            }
        }
    }

    loadPatients(): void {
        this.isLoadingPatients = true;
        this.patientService.getAllPatients().pipe(takeUntil(this.destroy$)).subscribe({
            next: (data) => {
                Promise.resolve().then(() => {
                    this.patients = data;
                    this.isLoadingPatients = false;
                    this.hasPatients = this.patients && this.patients.length > 0;
                    this.cd.detectChanges();

                    // Auto-select first patient for better UX
                    if (data.length > 0) {
                        this.selectPatient(data[0].id);
                    }
                });
            },
            error: (err) => {
                Promise.resolve().then(() => {
                    console.error('Error loading patients', err);
                    this.isLoadingPatients = false;
                    this.cd.detectChanges();
                });
            }
        });
    }

    selectPatient(id: string | number | null): void {
        if (!id) return;

        Promise.resolve().then(() => {
            // 1. RESET STATE TO PREVENT GHOSTING
            this.selectedPatient = null;
            this.editedPatient = {};
            this.pefTrend = [];
            this.config.patientId = id;
            if (this.chartInstance) {
                this.chartInstance.destroy();
                this.chartInstance = null;
            }
            this.cd.detectChanges();

            this.patientService.getPatientById(id).pipe(takeUntil(this.destroy$)).subscribe(p => {
                Promise.resolve().then(() => {
                    this.selectedPatient = p;
                    this.editedPatient = JSON.parse(JSON.stringify(p));

                    // --- Parse allergies: prefer structured array, fall back to comma-separated string ---
                    if (!this.editedPatient.allergies || this.editedPatient.allergies.length === 0) {
                        const raw = this.editedPatient.known_allergies || this.editedPatient.known_allergies_text || '';
                        this.editedPatient.allergies = raw
                            ? raw.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
                            : [];
                    } else if (typeof this.editedPatient.allergies === 'string') {
                        this.editedPatient.allergies = (this.editedPatient.allergies as string)
                            .split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
                    }

                    // --- Parse medications: prefer structured array, fall back to current_medications string ---
                    if (!this.editedPatient.medications || this.editedPatient.medications.length === 0) {
                        const raw = this.editedPatient.current_medications || '';
                        if (raw) {
                            this.editedPatient.medications = raw
                                .split(/[,;\n]/)
                                .map((s: string) => s.trim())
                                .filter((s: string) => s.length > 0)
                                .map((name: string) => ({ name, dosage: '', frequency: '' }));
                        } else {
                            this.editedPatient.medications = [];
                        }
                    }

                    this.calculateDerivedData();
                    this.cd.detectChanges();
                    // Render chart after DOM settles
                    setTimeout(() => { this.renderChart(); }, 100);
                });
            });
            this.patientService.getPEFTrend(id).pipe(takeUntil(this.destroy$)).subscribe(t => {
                Promise.resolve().then(() => {
                    this.pefTrend = t;
                    if (this.selectedPatient) this.renderChart();
                    this.cd.detectChanges();
                });
            });
        });
    }

    onLogoSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.institutionLogo = e.target.result;
                // Ideally save logo too, but it might be large.
                // For now, let's NOT save the logo to keeps storage light, or warn.
            };
            reader.readAsDataURL(file);
        }
    }

    getSortedSections() {
        return this.config.sections.filter(s => s.enabled).sort((a, b) => a.order - b.order);
    }

    dropSection(event: CdkDragDrop<any[]>) {
        moveItemInArray(this.config.sections, event.previousIndex, event.currentIndex);
        // Update order property
        this.config.sections.forEach((s, index) => s.order = index);
        this.saveSettings();
    }

    // --- In-Situ Editing Helpers ---
    addAllergy(event: any): void {
        const value = (event.value || '').trim();
        if (value) {
            if (!this.editedPatient.allergies) this.editedPatient.allergies = [];
            this.editedPatient.allergies.push(value);
        }
        event.chipInput!.clear();
    }

    removeAllergy(allergy: string): void {
        const index = this.editedPatient.allergies.indexOf(allergy);
        if (index >= 0) {
            this.editedPatient.allergies.splice(index, 1);
        }
    }

    addMedication(): void {
        if (!this.editedPatient.medications) this.editedPatient.medications = [];
        this.editedPatient.medications.push({ name: '', dosage: '', frequency: '' });
    }

    removeMedication(index: number): void {
        if (this.editedPatient.medications) {
            this.editedPatient.medications.splice(index, 1);
        }
    }

    saveSettings(): void {
        this.storageService.setItem('asmasync_report_settings', this.config);
    }

    updatePaperSize(size: 'letter' | 'a4' | 'legal'): void {
        this.config.paperSize = size;
        this.saveSettings();
    }

    // ... (rest of methods)

    renderChart() {
        // Safe check for canvas existence
        const canvas = document.getElementById('reportChartCanvas') as HTMLCanvasElement;

        // Check for PEF Trend AND Canvas
        if (!canvas || !this.pefTrend || this.pefTrend.length === 0) return;

        // Destroy existing to avoid memory leaks/glitches
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: this.pefTrend.map(d => d.date),
                datasets: [{
                    label: 'PEF (L/min)',
                    data: this.pefTrend.map(d => d.pefValue),
                    borderColor: this.config.primaryColor,
                    backgroundColor: 'rgba(14, 116, 144, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 }, // Disable animation for PDF stability
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: false, grid: { display: true, color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    async downloadPDF() {
        if (!this.selectedPatient) {
            this.snackBar.open('Seleccione un paciente primero', 'Cerrar', { duration: 3000 });
            return;
        }

        // Step 1: Capture chart image BEFORE isGenerating changes the DOM
        if (this.chartInstance) {
            try {
                const canvas = document.getElementById('reportChartCanvas') as HTMLCanvasElement;
                this.chartImageSrc = canvas ? canvas.toDataURL('image/png') : this.chartInstance.toBase64Image();
            } catch (e) { console.warn('Could not export chart image', e); }
        }

        // Step 2: Update state, wait for Angular to fully render the reportContent
        this.isGenerating = true;
        this.cd.detectChanges();
        // Wait for DOM to settle (2 animation frames + extra buffer)
        await new Promise(resolve => requestAnimationFrame(() =>
            requestAnimationFrame(() => setTimeout(resolve, 150))
        ));

        try {
            const content = this.reportContent.nativeElement as HTMLElement;
            const rawName = this.selectedPatient?.full_name || 'Paciente';
            const safeName = this.pdfExport.sanitizeName(rawName);
            const filename = `Reporte_${safeName}_${Date.now()}.pdf`;

            await this.pdfExport.exportElement(content, {
                filename,
                paperSize: this.config.paperSize,
                scale: 2
            });

            this.snackBar.open('¡Reporte generado exitosamente!', 'OK', { duration: 3000 });

        } catch (error) {
            console.error('PDF Generation Error:', error);
            this.snackBar.open('Error al generar PDF. Revisa la consola.', 'Cerrar', { duration: 4000 });
        } finally {
            Promise.resolve().then(() => {
                this.chartImageSrc = null;
                this.isGenerating = false;
                this.cd.detectChanges();
            });
        }
    }

    // --- Computed Properties for Stability (Fix NG0100) ---
    computedAge: number = 0;
    computedCurp: string = '';

    calculateDerivedData(): void {
        // Age
        if (this.selectedPatient?.date_of_birth) {
            this.computedAge = Math.floor((new Date().getTime() - new Date(this.selectedPatient.date_of_birth).getTime()) / 31557600000);
        } else {
            this.computedAge = 0;
        }

        // CURP — only show if the patient has a real CURP on record
        this.computedCurp = (this.selectedPatient as any)?.curp || '';
    }

    getPatientInitials(fullName: string): string {
        if (!fullName) return '??';
        return fullName.split(' ')
            .filter(w => w.length > 0)
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '??';
    }

    getRiskLabel(level: string): string {
        return riskHelper.getRiskLabel(level);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
    }

    setPeriod(period: 'week' | 'month' | 'custom'): void {
        this.activePeriod = period;
        const today = new Date();
        const fmt = (d: Date) => d.toISOString().split('T')[0];

        if (period === 'week') {
            const from = new Date(today); from.setDate(today.getDate() - 7);
            this.weeklyFrom = fmt(from);
            this.weeklyTo = fmt(today);
        } else if (period === 'month') {
            const from = new Date(today); from.setDate(today.getDate() - 30);
            this.weeklyFrom = fmt(from);
            this.weeklyTo = fmt(today);
        }
        // Load preview summary stats
        if (period !== 'custom') this.loadWeeklySummary();
    }

    loadWeeklySummary(): void {
        this.patientService.getWeeklySummary(this.weeklyFrom, this.weeklyTo)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => Promise.resolve().then(() => {
                    this.weeklySummaryStats = data;
                    this.cd.detectChanges();
                }),
                error: () => Promise.resolve().then(() => {
                    this.weeklySummaryStats = null;
                    this.cd.detectChanges();
                })
            });
    }

    downloadWeeklyReport(): void {
        this.isExportingWeekly = true;
        this.patientService.downloadWeeklyPdf(this.weeklyFrom, this.weeklyTo)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (blob: Blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const from = this.weeklyFrom.replace(/-/g, '');
                    const to = this.weeklyTo.replace(/-/g, '');
                    const ext = blob.type.includes('html') ? 'html' : 'pdf';
                    a.download = `Reporte_Pacientes_${from}_${to}.${ext}`;
                    a.click();
                    URL.revokeObjectURL(url);
                    this.isExportingWeekly = false;
                    this.snackBar.open('Reporte grupal generado', 'OK', { duration: 4000 });
                    this.loadWeeklySummary();
                },
                error: () => {
                    // Backend endpoint not available — generate client-side summary PDF
                    this.generateClientSideWeeklyPdf();
                }
            });
    }

    private async generateClientSideWeeklyPdf(): Promise<void> {
        const stats = this.weeklySummaryStats;
        const total = stats?.total_patients ?? this.patients.length;
        const low = stats?.risk_distribution?.low ?? this.patients.filter(p => p.riskLevel === 'low').length;
        const high   = stats?.risk_distribution?.high ?? this.patients.filter(p => p.riskLevel === 'high').length;
        const moderate = total - low - high;

        const rowsHtml = this.patients.map(p => `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:6px 8px;font-size:11px;font-weight:600;">${p.full_name}</td>
            <td style="padding:6px 8px;font-size:11px;text-align:center;">
              <span style="padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:700;
                background:${riskHelper.getRiskColor(p.riskLevel)}22;
                color:${riskHelper.getRiskColor(p.riskLevel)};">
                ${riskHelper.getRiskLabel(p.riskLevel)}
              </span>
            </td>
            <td style="padding:6px 8px;font-size:11px;text-align:center;">${p.latest_pef || '—'}</td>
            <td style="padding:6px 8px;font-size:11px;text-align:center;">${p.currentSpO2 ? p.currentSpO2+'%' : '—'}</td>
          </tr>`).join('');

        const html = `
<div style="font-family:'Inter',Arial,sans-serif;color:#1e293b;background:white;">
  <div style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:20px;border-radius:12px;margin-bottom:20px;">
    <div style="color:white;font-size:20px;font-weight:800;">Reporte Grupal de Pacientes</div>
    <div style="color:rgba(255,255,255,0.8);font-size:12px;margin-top:4px;">
      ${this.weeklyFrom} — ${this.weeklyTo} · ${this.doctorName}
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
    <div style="background:#f0fdf4;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-size:24px;font-weight:800;color:#16a34a;">${low}</div>
      <div style="font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;">Estables</div>
    </div>
    <div style="background:#fefce8;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-size:24px;font-weight:800;color:#ca8a04;">${moderate}</div>
      <div style="font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;">Moderados</div>
    </div>
    <div style="background:#fef2f2;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-size:24px;font-weight:800;color:#dc2626;">${high}</div>
      <div style="font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;">Críticos</div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr style="background:#f8fafc;">
        <th style="padding:8px;font-size:10px;text-align:left;font-weight:700;text-transform:uppercase;color:#64748b;">Paciente</th>
        <th style="padding:8px;font-size:10px;text-align:center;font-weight:700;text-transform:uppercase;color:#64748b;">Riesgo</th>
        <th style="padding:8px;font-size:10px;text-align:center;font-weight:700;text-transform:uppercase;color:#64748b;">PEF</th>
        <th style="padding:8px;font-size:10px;text-align:center;font-weight:700;text-transform:uppercase;color:#64748b;">SpO₂</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div style="margin-top:20px;padding-top:10px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="font-size:9px;color:#94a3b8;margin:0;">AsmaSync Medical Dashboard — Total: ${total} pacientes</p>
  </div>
</div>`;

        try {
            const from = this.weeklyFrom.replace(/-/g, '');
            const to   = this.weeklyTo.replace(/-/g, '');
            await this.pdfExport.exportFromHtml(html, {
                filename: `Reporte_Grupal_${from}_${to}.pdf`,
                paperSize: this.config.paperSize
            });
            this.snackBar.open('Reporte grupal generado', 'OK', { duration: 3000 });
        } catch (e) {
            this.snackBar.open('Error al generar reporte grupal.', 'Cerrar', { duration: 4000 });
        } finally {
            this.isExportingWeekly = false;
            this.cd.detectChanges();
        }
    }
}
