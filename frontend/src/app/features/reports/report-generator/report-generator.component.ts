import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
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

import { PatientService } from '../../../core/services/patient.service';
import { StorageService } from '../../../core/services/storage.service';
import { Patient, PEFTrend } from '../../../core/models/patient.model';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
        MatChipsModule
    ],
    templateUrl: './report-generator.component.html',
    styleUrls: ['./report-generator.component.scss']
})
export class ReportGeneratorComponent implements OnInit {
    @ViewChild('reportContent') reportContent!: ElementRef;

    today = new Date();
    patients: Patient[] = [];
    selectedPatient: Patient | null = null;

    // New: Edited Patient (In-Situ Editing)
    editedPatient: any = {};

    pefTrend: PEFTrend[] = [];

    isLoadingPatients = false;
    isGenerating = false;
    institutionLogo: string | null = null;

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
            { id: 'notes', label: 'Notas de Evolución', enabled: true, order: 4 },
            { id: 'recommendations', label: 'Recomendaciones', enabled: true, order: 5 },
            { id: 'signatures', label: 'Firmas', enabled: true, order: 6 }
        ]
    };

    // UI helpers
    activeSectionTab = 0;
    generatedPDF: any;
    chartInstance: any; // Store chart instance
    chartImageSrc: string | null = null; // For PDF generation

    constructor(
        private patientService: PatientService,
        private snackBar: MatSnackBar,
        private cd: ChangeDetectorRef, // Injected for manual detection
        private storageService: StorageService // Injected
    ) { }

    ngOnInit(): void {
        this.loadSettings();
        this.loadPatients();
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
        this.patientService.getAllPatients().subscribe({
            next: (data) => {
                this.patients = data;
                this.isLoadingPatients = false;
                // Auto-select first patient for better UX
                if (data.length > 0) {
                    this.selectPatient(data[0].id);
                }
            },
            error: (err) => {
                console.error('Error loading patients', err);
                this.isLoadingPatients = false;
            }
        });
    }

    selectPatient(id: string | number | null): void {
        if (!id) return;

        // Wrap in setTimeout to decouple from view selection event (fixes NG0100)
        setTimeout(() => {
            // 1. RESET STATE TO PREVENT GHOSTING
            this.selectedPatient = null;
            this.editedPatient = {};
            this.pefTrend = [];
            this.config.patientId = id;
            if (this.chartInstance) {
                this.chartInstance.destroy();
                this.chartInstance = null;
            }

            this.patientService.getPatientById(id).subscribe(p => {
                this.selectedPatient = p;
                // Clone for editing
                this.editedPatient = JSON.parse(JSON.stringify(p));
                // Ensure array fields exist
                if (!this.editedPatient.allergies) this.editedPatient.allergies = [];
                // Handle allergies if string (mock data messiness)
                if (typeof this.editedPatient.allergies === 'string') {
                    this.editedPatient.allergies = this.editedPatient.allergies.split(',').map((s: string) => s.trim()).filter((s: string) => s);
                }
                if (!this.editedPatient.medications) this.editedPatient.medications = [];

                // Trigger chart render after view update
                setTimeout(() => {
                    this.renderChart();
                    this.cd.markForCheck(); // Explicitly mark for check
                }, 100);

                this.calculateDerivedData(); // Update computed properties
                this.cd.markForCheck();
            });
            this.patientService.getPEFTrend(id).subscribe(t => {
                this.pefTrend = t;
                if (this.selectedPatient) this.renderChart(); // Re-render if trend comes later
                this.cd.markForCheck();
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

    // --- PDF GENERATION ENGINE ---
    // --- PDF GENERATION ENGINE ---
    async downloadPDF() {
        if (!this.selectedPatient) {
            this.snackBar.open('Seleccione un paciente primero', 'Cerrar', { duration: 3000 });
            return;
        }

        // FORCE ANGULAR CYCLE

        // Wrap start in setTimeout to ensure button click event finishes bubbling
        setTimeout(() => {
            this.isGenerating = true;

            // WRAP IN TIMEOUT TO AVOID NG0100
            setTimeout(async () => {
                try {
                    // 1. CHART RENDER HACK FOR PDF
                    if (this.chartInstance) {
                        try {
                            const canvas = document.getElementById('reportChartCanvas') as HTMLCanvasElement;
                            if (canvas) {
                                this.chartImageSrc = canvas.toDataURL('image/png');
                            } else {
                                this.chartImageSrc = this.chartInstance.toBase64Image();
                            }
                        } catch (e) {
                            console.warn('Could not export chart', e);
                        }
                        this.cd.detectChanges(); // Update view to show <img> and hide <canvas>

                        // Wait for image to render in DOM
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }

                    const content = this.reportContent.nativeElement;

                    // 2. Capture High-Res Canvas
                    // Wait for chart image to stabilize
                    setTimeout(async () => {
                        const canvas = await html2canvas(content, {
                            scale: 2, // 2x resolution
                            useCORS: true,
                            logging: false,
                            windowWidth: 1200 // Consistent width
                        });

                        // 3. Generate PDF
                        const imgData = canvas.toDataURL('image/png');

                        // Dynamic Format based on Config
                        const pdf = new jsPDF({
                            orientation: 'portrait',
                            unit: 'mm',
                            format: this.config.paperSize as any
                        });

                        // Calculate dimensions based on paper size
                        let pdfWidth = 210;
                        let pdfPageHeight = 297;
                        switch (this.config.paperSize) {
                            case 'letter': pdfWidth = 215.9; pdfPageHeight = 279.4; break;
                            case 'legal': pdfWidth = 215.9; pdfPageHeight = 355.6; break;
                            case 'a4': default: pdfWidth = 210; pdfPageHeight = 297; break;
                        }

                        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
                        let heightLeft = imgHeight;
                        let position = 0;

                        // First page
                        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                        heightLeft -= pdfPageHeight;

                        while (heightLeft >= 0) {
                            position = heightLeft - imgHeight;
                            pdf.addPage();
                            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                            heightLeft -= pdfPageHeight;
                        }

                        // 4. Save
                        const filename = `Reporte_${(this.selectedPatient?.full_name || 'Paciente').replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
                        pdf.save(filename);

                        this.snackBar.open('Reporte generado exitosamente', 'OK', { duration: 3000 });

                        // Restore lock
                        this.isGenerating = false;
                        this.chartImageSrc = null; // Hide the temp image
                        this.cd.detectChanges();

                    }, 100); // 100ms delay to ensure DOM is painted

                } catch (error) {
                    console.error('PDF Generation Error:', error);
                    this.snackBar.open('Error al generar PDF', 'Cerrar', { duration: 3000 });
                } finally {
                    // Restore State
                    this.chartImageSrc = null;
                    this.isGenerating = false;
                    // this.cd.detectChanges(); // REMOVED: Auto-detection should handle this at end of macrotask
                }
            }, 0);
        }, 0);
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

        // CURP
        if (!this.selectedPatient || !this.selectedPatient.full_name) {
            this.computedCurp = '';
        } else {
            const namePart = (this.selectedPatient.full_name || 'XXXX').substring(0, 4).toUpperCase();
            const dobPart = this.selectedPatient.date_of_birth ? this.selectedPatient.date_of_birth.replace(/-/g, '').substring(2, 8) : '010101';
            this.computedCurp = `${namePart}${dobPart}HMXRNS00`.padEnd(18, '0');
        }
    }

    getRiskLabel(level: string): string {
        switch (level) {
            case 'red': return 'RIESGO ALTO';
            case 'yellow': return 'RIESGO MODERADO';
            case 'green': return 'BAJO RIESGO';
            default: return 'DESCONOCIDO';
        }
    }
}
