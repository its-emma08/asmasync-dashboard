import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AgePipe } from '../../../shared/pipes/age-pipe';
import { SafeDatePipe } from '../../../shared/pipes/safe-date.pipe';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, merge, startWith, switchMap, catchError, of, map, Subject, takeUntil } from 'rxjs';

// Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
// import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe'; // Unused

import { PatientService } from '../../../core/services/patient.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { SearchService } from '../../../core/services/search.service';
import { Patient } from '../../../core/models/patient.model';
import { SkeletonTableComponent } from '../../../shared/components/skeleton-table/skeleton-table';

@Component({
    selector: 'app-patient-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSnackBarModule,
        MatSortModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatCardModule,
        MatTooltipModule,
        MatMenuModule,
        AgePipe,
        AgePipe,
        SafeDatePipe,
        SkeletonTableComponent // Added
    ],
    templateUrl: './patient-list.component.html',
    styleUrls: ['./patient-list.component.scss']
})
export class PatientListComponent implements OnInit, OnDestroy {
    displayedColumns: string[] = ['fullName', 'age', 'riskLevel', 'currentPEF', 'adherence', 'lastUpdate', 'actions'];
    data: Patient[] = [];

    resultsLength = 0;
    isLoadingResults = true;
    isRateLimitReached = false;

    // Form Controls
    searchControl = new FormControl('');
    riskFilterControl = new FormControl('all');

    // Risk levels for filter dropdown
    riskLevels = [
        { value: 'all', label: 'Todos los niveles' },
        { value: 'red', label: 'Crítico' },
        { value: 'yellow', label: 'Moderado' },
        { value: 'green', label: 'Bajo' }
    ];

    // Private properties
    private _paginator: MatPaginator | null = null;
    private _sort: MatSort | null = null;
    private destroy$ = new Subject<void>();
    private refreshTable$ = new Subject<void>();

    constructor(
        private patientService: PatientService,
        private wsService: WebSocketService,
        private searchService: SearchService, // Injected
        private cd: ChangeDetectorRef,
        private snackBar: MatSnackBar
    ) { }


    ngOnInit(): void {
        // Initialize table logic immediately, do not wait for ViewChild
        this.setupTable();
        this.setupRealtimeUpdates();

        // Connect Global Search
        this.searchService.search$.pipe(takeUntil(this.destroy$)).subscribe(term => {
            if (this.searchControl.value !== term) {
                this.searchControl.setValue(term);
            }
        });

        // Trigger initial load
        this.refreshTable$.next();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ViewChild setters now only update the existing subscription sources if needed, 
    // or we just let the stream handle it since we use them dynamically in switchMap
    @ViewChild(MatPaginator) set paginator(p: MatPaginator) {
        this._paginator = p;
        // Trigger a refresh when paginator becomes available
        if (this._paginator) {
            this._paginator.page.pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshTable$.next());
        }
    }

    @ViewChild(MatSort) set sort(s: MatSort) {
        this._sort = s;
        if (this._sort) {
            this._sort.sortChange.pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshTable$.next());
        }
    }

    setupTable(): void {
        // Core data loading stream
        merge(
            this.searchControl.valueChanges,
            this.riskFilterControl.valueChanges,
            this.refreshTable$
        )
            .pipe(
                takeUntil(this.destroy$),
                startWith({}),
                debounceTime(300),
                switchMap(() => {
                    this.isLoadingResults = true;
                    this.cd.markForCheck();

                    const pageIndex = this._paginator ? this._paginator.pageIndex : 0;
                    const pageSize = this._paginator ? this._paginator.pageSize : 10;

                    return this.patientService.getPatients(
                        pageIndex + 1,
                        pageSize,
                        this.searchControl.value || '',
                        this.riskFilterControl.value || 'all'
                    ).pipe(
                        catchError(() => of(null)),
                        map(res => {
                            if (!res) return null;
                            // Frontend-side archive filtering (Mock)
                            const filteredData = res.data.filter(p =>
                                this.showArchived ? this.archivedPatients.has(p.id) : !this.archivedPatients.has(p.id)
                            );
                            return { ...res, data: filteredData, total: filteredData.length }; // Adjust total mock
                        })
                    );
                }),
                map(data => {
                    this.isLoadingResults = false;
                    this.isRateLimitReached = data === null;

                    if (data === null) {
                        return [];
                    }

                    this.resultsLength = data.total;
                    this.cd.markForCheck();
                    return data.data;
                })
            ).subscribe(data => {
                this.data = data;
                this.cd.markForCheck();
            });

        // Reset page on filter change
        merge(this.searchControl.valueChanges, this.riskFilterControl.valueChanges)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                if (this._paginator) this._paginator.pageIndex = 0;
            });
    }

    setupRealtimeUpdates(): void {
        this.wsService.messages$
            .pipe(takeUntil(this.destroy$))
            .subscribe(msg => {
                if (msg.type === 'patient_update' || msg.type === 'risk_update') {
                    this.refreshTable$.next();
                }
            });
    }

    clearFilters(): void {
        this.searchControl.setValue('');
        this.riskFilterControl.setValue('all');
    }

    showFeatureComingSoon(featureName: string): void {
        this.snackBar.open(`🛠️ La función "${featureName}" estará disponible próximamente.`, 'Entendido', {
            duration: 3000,
            panelClass: 'glass-toast'
        });
    }


    // Phase 11: Mock Archive
    archivedPatients: Set<string | number> = new Set();
    showArchived = false;

    toggleArchivedView(): void {
        this.showArchived = !this.showArchived;
        this.refreshTable$.next();
    }

    archivePatient(id: string | number): void {
        this.archivedPatients.add(id);
        this.snackBar.open('Paciente archivado', 'Deshacer', { duration: 4000 }).onAction().subscribe(() => {
            this.archivedPatients.delete(id);
            this.refreshTable$.next();
        });
        this.refreshTable$.next();
    }

    restorePatient(id: string | number): void {
        this.archivedPatients.delete(id);
        this.snackBar.open('Paciente restaurado', 'Cerrar', { duration: 3000 });
        this.refreshTable$.next();
    }

    getRiskLabel(level: string): string {
        switch (level) {
            case 'red': return 'Crítico';
            case 'yellow': return 'Moderado';
            case 'green': return 'Bajo';
            default: return level;
        }
    }

    trackByPatientId(index: number, patient: Patient): string | number {
        return patient.id;
    }
}
