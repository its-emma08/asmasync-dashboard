import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { SearchService } from '../../../../../core/services/search.service';
import { Subject } from 'rxjs';
import { Patient } from '../../../../../core/models/patient.model';
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

    filterPatients(globalTerm: string) {
        const global = globalTerm ? globalTerm.toLowerCase().trim() : '';
        const local = this.localSearchTerm ? this.localSearchTerm.toLowerCase().trim() : '';

        this.filteredPatients = this.patients.filter(p => {
            const matchesGlobal = !global || p.full_name.toLowerCase().includes(global);
            const matchesLocal = !local || p.full_name.toLowerCase().includes(local);
            return matchesGlobal && matchesLocal;
        });
    }

    getAge(dobString: string): number {
        if (!dobString) return 0;
        const dob = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
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
