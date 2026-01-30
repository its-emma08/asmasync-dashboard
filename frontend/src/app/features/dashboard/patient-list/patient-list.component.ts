import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, merge, startWith, switchMap, catchError, of, map, Subject } from 'rxjs';

// Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PatientService } from '../../../core/services/patient.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { Patient } from '../../../core/models/patient.model';

@Component({
    selector: 'app-patient-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatCardModule,
        MatTooltipModule
    ],
    templateUrl: './patient-list.component.html',
    styleUrls: ['./patient-list.component.scss']
})
export class PatientListComponent implements OnInit, AfterViewInit {
    displayedColumns: string[] = ['id', 'fullName', 'age', 'riskLevel', 'currentPEF', 'currentSpO2', 'lastUpdate', 'actions'];
    data: Patient[] = [];

    resultsLength = 0;
    isLoadingResults = true;
    isRateLimitReached = false;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    searchControl = new FormControl('');
    riskFilterControl = new FormControl('all');

    private refreshTable$ = new Subject<void>();

    riskLevels = [
        { value: 'all', viewValue: 'Todos los niveles' },
        { value: 'green', viewValue: 'Bajo (Verde)' },
        { value: 'yellow', viewValue: 'Moderado (Amarillo)' },
        { value: 'red', viewValue: 'Crítico (Rojo)' }
    ];

    constructor(
        private patientService: PatientService,
        private wsService: WebSocketService
    ) { }

    ngOnInit(): void {
        this.setupRealtimeUpdates();
    }

    ngAfterViewInit(): void {
        // Si cambia el orden, volver a primera página
        this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

        // Si filtran, volver a primera página
        merge(this.searchControl.valueChanges, this.riskFilterControl.valueChanges)
            .subscribe(() => this.paginator.pageIndex = 0);

        merge(
            this.sort.sortChange,
            this.paginator.page,
            this.searchControl.valueChanges,
            this.riskFilterControl.valueChanges,
            this.refreshTable$
        )
            .pipe(
                startWith({}),
                debounceTime(300), // Esperar a que usuario termine de escribir
                switchMap(() => {
                    this.isLoadingResults = true;
                    return this.patientService.getPatients(
                        this.paginator.pageIndex + 1,
                        this.paginator.pageSize,
                        this.searchControl.value || '',
                        this.riskFilterControl.value || 'all'
                    ).pipe(catchError(() => of(null)));
                }),
                map(data => {
                    this.isLoadingResults = false;
                    this.isRateLimitReached = data === null;

                    if (data === null) {
                        return [];
                    }

                    this.resultsLength = data.total;
                    return data.data;
                })
            ).subscribe(data => this.data = data);
    }

    setupRealtimeUpdates(): void {
        this.wsService.messages$.subscribe(msg => {
            if (msg.type === 'patient_update' || msg.type === 'risk_update') {
                this.refreshTable$.next();
            }
        });
    }

    clearFilters(): void {
        this.searchControl.setValue('');
        this.riskFilterControl.setValue('all');
    }

    getRiskLabel(level: string): string {
        switch (level) {
            case 'red': return 'Crítico';
            case 'yellow': return 'Moderado';
            case 'green': return 'Bajo';
            default: return level;
        }
    }

    getRiskClass(level: string): string {
        return `risk-badge risk-${level}`;
    }

    trackByPatientId(index: number, patient: Patient): number {
        return patient.id;
    }
}
