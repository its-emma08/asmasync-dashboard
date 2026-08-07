import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { SearchService } from '../../../../../core/services/search.service';
import { Subject } from 'rxjs';
import { Patient } from '../../../../../core/models/patient.model';
import { AgePipe } from '../../../../../shared/pipes/age-pipe';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-patients-table-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
    templateUrl: './patients-table-widget.component.html',
    styleUrl: './patients-table-widget.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientsTableWidgetComponent implements OnInit, OnChanges, OnDestroy {
    @Input() patients: Patient[] = [];
    filteredPatients: Patient[] = [];
    localSearchTerm = '';
    selectedRiskFilter: 'all' | 'high' | 'moderate' | 'low' = 'all';
    sortBy: 'name' | 'adherence' | 'pef' = 'name';
    sortDir: 'asc' | 'desc' = 'asc';
    private destroy$ = new Subject<void>();

    constructor(
        private searchService: SearchService,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.searchService.search$
            .pipe(takeUntil(this.destroy$))
            .subscribe(term => {
                this.filterPatients(term);
                this.cd.markForCheck();
            });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['patients']) {
            this.filterPatients(this.searchService.currentTerm);
        }
    }

    onLocalSearch(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.localSearchTerm = value;
        this.filterPatients(this.searchService.currentTerm);
    }

    setRiskFilter(filter: 'all' | 'high' | 'moderate' | 'low'): void {
        this.selectedRiskFilter = filter;
        this.filterPatients(this.searchService.currentTerm);
    }

    filterPatients(globalTerm: string) {
        const global = globalTerm ? globalTerm.toLowerCase().trim() : '';
        const local = this.localSearchTerm ? this.localSearchTerm.toLowerCase().trim() : '';

        this.filteredPatients = this.patients.filter(p => {
            const name = (p.full_name || '').toLowerCase();
            const matchesGlobal = !global || name.includes(global);
            const matchesLocal = !local || name.includes(local);
            const matchesRisk = this.selectedRiskFilter === 'all' || p.riskLevel === this.selectedRiskFilter;
            return matchesGlobal && matchesLocal && matchesRisk;
        });
        this.applySort();
    }

    sort(by: 'name' | 'adherence' | 'pef'): void {
        if (this.sortBy === by) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = by;
            this.sortDir = 'asc';
        }
        this.applySort();
    }

    sortIcon(by: 'name' | 'adherence' | 'pef'): string {
        if (this.sortBy !== by) return 'unfold_more';
        return this.sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
    }

    private applySort(): void {
        const dir = this.sortDir === 'asc' ? 1 : -1;
        this.filteredPatients = [...this.filteredPatients].sort((a, b) => {
            let r = 0;
            if (this.sortBy === 'name') {
                r = (a.full_name || '').localeCompare(b.full_name || '');
            } else if (this.sortBy === 'adherence') {
                r = (a.adherence ?? 0) - (b.adherence ?? 0);
            } else {
                r = (a.latest_pef ?? 0) - (b.latest_pef ?? 0);
            }
            return r * dir;
        });
    }

    getAge(patient: any): number | string {
        const val = new AgePipe().transform(patient);
        return val !== '' ? val : '—';
    }

    getAdherenceColor(adherence: number): string {
        // Continuous HSL transition from Red (0) to Green (120)
        // Hue = 0 (Red) at 30% or less, Hue = 120 (Green) at 90% or more
        const pct = Math.max(30, Math.min(90, adherence));
        const normalized = (pct - 30) / (90 - 30); // 0 to 1
        const hue = Math.round(normalized * 120);
        return `hsl(${hue}, 78%, 45%)`;
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
