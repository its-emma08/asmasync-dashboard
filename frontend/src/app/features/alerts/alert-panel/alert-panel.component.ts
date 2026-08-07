import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil, take } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AgePipe } from '../../../shared/pipes/age-pipe';
import { SafeDatePipe } from '../../../shared/pipes/safe-date.pipe';
import { PatientService } from '../../../core/services/patient.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { Patient } from '../../../core/models/patient.model';
import * as riskHelper from '../../../core/utils/risk.helper';

@Component({
    selector: 'app-alert-panel',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        MatIconModule, MatButtonModule, MatProgressSpinnerModule,
        MatSnackBarModule, MatTooltipModule,
        AgePipe, SafeDatePipe
    ],
    templateUrl: './alert-panel.component.html',
    styleUrls: ['./alert-panel.component.scss']
})
export class AlertPanelComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    allPatients: Patient[] = [];
    filteredPatients: Patient[] = [];
    loading = true;
    activeFilter: 'all' | 'critical' | 'moderate' = 'all';
    searchTerm = '';
    soundEnabled = true;

    constructor(
        private patientService: PatientService,
        private router: Router,
        private cd: ChangeDetectorRef,
        private wsService: WebSocketService
    ) { }

    ngOnInit(): void {
        this.loadPatients();
        this.setupWebSocketListener();
    }

    private setupWebSocketListener(): void {
        this.wsService.messages$.pipe(takeUntil(this.destroy$)).subscribe(msg => {
            if (!msg) return;
            const type = msg.type ?? msg.event ?? '';
            const relevant = ['risk_update', 'emergency_alert', 'pef_update', 'vital_signs', 'new_symptom'];
            if (relevant.includes(type)) {
                this.loadPatients();
            }
        });
    }

    loadPatients(): void {
        this.loading = true;
        this.patientService.getAllPatients()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (patients) => {
                    // Only risk patients, sorted: critical first
                    this.allPatients = patients
                        .filter(p => p.riskLevel === 'high' || p.riskLevel === 'moderate')
                        .sort((a, b) => {
                            if (a.riskLevel === 'high' && b.riskLevel !== 'high') return -1;
                            if (b.riskLevel === 'high' && a.riskLevel !== 'high') return 1;
                            return 0;
                        });
                    this.applySearch();
                    this.loading = false;
                    this.cd.markForCheck();
                },
                error: () => {
                    this.loading = false;
                    this.cd.markForCheck();
                }
            });
    }

    filter(type: 'all' | 'critical' | 'moderate'): void {
        this.activeFilter = type;
        this.applySearch();
    }

    applySearch(): void {
        let base = this.allPatients;
        if (this.activeFilter === 'critical') base = base.filter(p => p.riskLevel === 'high');
        if (this.activeFilter === 'moderate') base = base.filter(p => p.riskLevel === 'moderate');

        const term = this.searchTerm.toLowerCase().trim();
        this.filteredPatients = term
            ? base.filter(p => p.full_name?.toLowerCase().includes(term))
            : base;
    }

    get hasCritical(): boolean {
        return this.allPatients.some(p => p.riskLevel === 'high');
    }

    get criticalCount(): number {
        return this.allPatients.filter(p => p.riskLevel === 'high').length;
    }

    get moderateCount(): number {
        return this.allPatients.filter(p => p.riskLevel === 'moderate').length;
    }

    navigateToPatient(patientId: string | number): void {
        this.router.navigate(['/dashboard/patients', patientId]);
    }

    markAsResolved(patient: Patient): void {
        this.allPatients = this.allPatients.filter(p => p.id !== patient.id);
        this.applySearch();
        this.patientService.resolveAlert(patient.id).pipe(take(1)).subscribe();
    }

    getRiskLabel(level: string): string {
        return riskHelper.getRiskLabel(level);
    }

    onImgError(event: Event): void {
        (event.target as HTMLElement).style.display = 'none';
    }

    trackById(_: number, p: Patient): any {
        return p.id;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
