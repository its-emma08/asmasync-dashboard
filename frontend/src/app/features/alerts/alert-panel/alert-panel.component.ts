import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { AgePipe } from '../../../shared/pipes/age-pipe';
import { SafeDatePipe } from '../../../shared/pipes/safe-date.pipe';

import { PatientService } from '../../../core/services/patient.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { Patient } from '../../../core/models/patient.model';

@Component({
    selector: 'app-alert-panel',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatToolbarModule,
        MatChipsModule,
        MatListModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        FormsModule,
        AgePipe,
        SafeDatePipe
    ],
    templateUrl: './alert-panel.component.html',
    styleUrls: ['./alert-panel.component.scss']
})
export class AlertPanelComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    // Static configuration for filters to prevent NG0100
    filterIcons = {
        all: 'list',
        critical: 'warning',
        moderate: 'error_outline'
    };

    allPatients: Patient[] = [];
    filteredPatients: Patient[] = [];
    loading = true;
    activeFilter: 'all' | 'critical' | 'moderate' = 'all';

    constructor(
        private patientService: PatientService,
        private wsService: WebSocketService,
        private router: Router,
        private snackBar: MatSnackBar,
        private cd: ChangeDetectorRef
    ) {
        // Initialize with empty/default to be safe
        this.allPatients = [];
        this.filteredPatients = [];
    }

    ngOnInit(): void {
        this.loadPatients();
    }

    loadPatients(): void {
        this.loading = true;
        this.patientService.getAllPatients()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (patients) => {
                    // Start with all high risk patients
                    this.allPatients = patients.filter(p => p.riskLevel === 'red' || p.riskLevel === 'yellow');
                    this.filter(this.activeFilter);
                    this.loading = false;
                    this.cd.markForCheck();
                },
                error: (err) => {
                    console.error(err);
                    this.loading = false;
                    this.cd.markForCheck();
                }
            });
    }

    filter(type: 'all' | 'critical' | 'moderate'): void {
        this.activeFilter = type;
        if (type === 'all') {
            this.filteredPatients = this.allPatients;
        } else if (type === 'critical') {
            this.filteredPatients = this.allPatients.filter(p => p.riskLevel === 'red');
        } else if (type === 'moderate') {
            this.filteredPatients = this.allPatients.filter(p => p.riskLevel === 'yellow');
        }
    }

    navigateToPatient(patientId: string | number): void {
        this.router.navigate(['/dashboard/patients', patientId]);
    }

    markAsResolved(patient: Patient): void {
        this.patientService.resolveAlert(patient.id).subscribe(success => {
            if (success) {
                this.snackBar.open('Alerta marcada como atendida', 'OK', { duration: 3000 });
                // Remove from local list visually
                this.allPatients = this.allPatients.filter(p => p.id !== patient.id);
                this.filter(this.activeFilter);
            } else {
                this.snackBar.open('Error al actualizar estado', 'Error', { duration: 3000 });
            }
        });
    }

    getRiskLabel(level: string): string {
        switch (level) {
            case 'red': return 'Crítico';
            case 'yellow': return 'Moderado';
            default: return level;
        }
    }

    getRiskClass(level: string): string {
        switch (level) {
            case 'red': return 'bg-red-50 text-brand-coral border-red-100';
            case 'yellow': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
            default: return 'bg-gray-50 text-gray-500';
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
