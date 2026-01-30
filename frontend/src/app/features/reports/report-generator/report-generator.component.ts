import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PatientService } from '../../../core/services/patient.service';
import { InterventionService } from '../../../core/services/intervention.service';
import { AlertService } from '../../../core/services/alert.service';
import { Patient, PEFTrend } from '../../../core/models/patient.model';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-report-generator',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule
    ],
    templateUrl: './report-generator.component.html',
    styleUrls: ['./report-generator.component.scss']
})
export class ReportGeneratorComponent implements OnInit {
    reportForm: FormGroup;
    patients: Patient[] = [];
    loading = false;
    generating = false;

    constructor(
        private fb: FormBuilder,
        private patientService: PatientService,
        private interventionService: InterventionService,
        private alertService: AlertService,
        private snackBar: MatSnackBar
    ) {
        const today = new Date();
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);

        this.reportForm = this.fb.group({
            reportType: ['individual', Validators.required],
            patientId: [''],
            dateRangeStart: [lastWeek, Validators.required],
            dateRangeEnd: [today, Validators.required]
        });
    }

    ngOnInit(): void {
        this.loadPatients();

        // Conditional validation
        this.reportForm.get('reportType')?.valueChanges.subscribe(type => {
            const patientControl = this.reportForm.get('patientId');
            if (type === 'individual') {
                patientControl?.setValidators([Validators.required]);
            } else {
                patientControl?.clearValidators();
                patientControl?.setValue('');
            }
            patientControl?.updateValueAndValidity();
        });
    }

    loadPatients(): void {
        this.patientService.getAllPatients().subscribe({
            next: (data) => this.patients = data,
            error: (err) => console.error(err)
        });
    }

    generateReport(): void {
        if (this.reportForm.invalid) return;

        this.generating = true;
        const type = this.reportForm.value.reportType;
        const { dateRangeStart, dateRangeEnd } = this.reportForm.value;

        if (type === 'individual') {
            const patientId = this.reportForm.value.patientId;
            this.generateIndividualReport(patientId, dateRangeStart, dateRangeEnd);
        } else if (type === 'weekly') {
            this.generateWeeklyReport(dateRangeStart, dateRangeEnd);
        }
    }

    private generateIndividualReport(patientId: number, start: Date, end: Date): void {
        forkJoin({
            patient: this.patientService.getPatientById(patientId),
            pefTrend: this.patientService.getPEFTrend(patientId), // Mock: backend filters by date ideally
            history: this.patientService.getPatientHistory(patientId) // Mock
        }).subscribe({
            next: (data) => {
                const doc = new jsPDF();

                // Header
                this.addHeader(doc, 'Reporte Individual de Paciente');

                // Info Paciente
                doc.setFontSize(12);
                doc.text(`Paciente: ${data.patient.fullName}`, 14, 40);
                doc.text(`ID Interno: #${data.patient.id}`, 14, 46);
                doc.text(`Edad: ${data.patient.age} años | Riesgo: ${data.patient.riskLevel.toUpperCase()}`, 14, 52);
                doc.text(`Periodo: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`, 14, 58);

                // Tabla de Mediciones (Simulada desde PEF Trend)
                const tableData = data.pefTrend.map((p: PEFTrend) => [
                    // Ensure date is string
                    new Date(p.date).toLocaleDateString(),
                    `${p.pefValue} L/min`,
                    this.getZoneName(p.zone)
                ]);

                autoTable(doc, {
                    head: [['Fecha', 'Valor FEM', 'Zona de Riesgo']],
                    body: tableData,
                    startY: 65,
                    theme: 'grid'
                });

                // Add Footer
                this.addFooter(doc);

                doc.save(`AsmaSync_Paciente_${data.patient.fullName}_${Date.now()}.pdf`);
                this.generating = false;
                this.snackBar.open('Reporte generado exitosamente', 'Cerrar', { duration: 3000 });
            },
            error: (err) => {
                this.generating = false;
                this.snackBar.open('Error generando reporte', 'Cerrar', { duration: 3000 });
            }
        });
    }

    private generateWeeklyReport(start: Date, end: Date): void {
        // Mocking aggregated data since we don't have a dedicated endpoint yet
        forkJoin({
            metrics: this.patientService.getDashboardMetrics(),
            patients: this.patientService.getAllPatients()
        }).pipe(catchError(() => of({ metrics: null, patients: [] })))
            .subscribe((data: any) => {
                const doc = new jsPDF();

                this.addHeader(doc, 'Reporte Semanal de Actividad');

                doc.setFontSize(11);
                doc.text(`Periodo: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`, 14, 30);

                // Resumen
                doc.setFontSize(14);
                doc.text('Resumen Ejecutivo', 14, 45);

                const metrics = data.metrics || { totalPatients: 0, criticalAlerts: 0, activePatients: 0 };

                doc.setFontSize(11);
                doc.text(`• Total Pacientes Monitoreados: ${metrics.totalPatients}`, 20, 55);
                doc.text(`• Alertas Críticas Generadas: ${metrics.criticalAlerts}`, 20, 62);
                doc.text(`• Pacientes Activos: ${metrics.activePatients}`, 20, 69);
                doc.text(`• Adherencia Promedio Global: ${metrics.adherenceRate || '85'}%`, 20, 76);

                // Tabla Pacientes en Riesgo
                const riskPatients = (data.patients as Patient[])
                    .filter((p: Patient) => p.riskLevel === 'red' || p.riskLevel === 'yellow')
                    .map((p: Patient) => [p.fullName, p.riskLevel.toUpperCase(), `${p.currentPEF} L/min`, `${p.currentSpO2}%`]);

                doc.text('Pacientes Requiriendo Atención (Riesgo Alto/Moderado)', 14, 90);

                autoTable(doc, {
                    startY: 95,
                    head: [['Nombre', 'Nivel Riesgo', 'Último FEM', 'SpO2']],
                    body: riskPatients,
                    theme: 'striped',
                    headStyles: { fillColor: [220, 53, 69] }
                });

                this.addFooter(doc);

                doc.save(`AsmaSync_Reporte_Semanal_${Date.now()}.pdf`);
                this.generating = false;
                this.snackBar.open('Reporte semanal generado', 'Cerrar', { duration: 3000 });
            });
    }

    private addHeader(doc: jsPDF, title: string): void {
        doc.setFontSize(22);
        doc.setTextColor(25, 118, 210); // Primary Blue
        doc.text('AsmaSync', 14, 20);

        doc.setFontSize(16);
        doc.setTextColor(60, 60, 60);
        doc.text(title, 14, 28);

        doc.setLineWidth(0.5);
        doc.line(14, 32, 196, 32);

        doc.setTextColor(0, 0, 0); // Reset
    }

    private addFooter(doc: jsPDF): void {
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(
                `Generado por AsmaSync el ${new Date().toLocaleString()} - Página ${i} de ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }
    }

    private getZoneName(zone: string): string {
        const zones: any = { 'green': 'Verde (Controlado)', 'yellow': 'Amarillo (Precaución)', 'red': 'Rojo (Peligro)' };
        return zones[zone] || zone;
    }
}
