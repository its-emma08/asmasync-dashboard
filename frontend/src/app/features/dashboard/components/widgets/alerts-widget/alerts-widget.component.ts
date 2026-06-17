import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AgePipe } from '../../../../../shared/pipes/age-pipe';
import { SafeDatePipe } from '../../../../../shared/pipes/safe-date.pipe';
import { SearchService } from '../../../../../core/services/search.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Patient } from '../../../../../core/models/patient.model';

@Component({
    selector: 'app-alerts-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, AgePipe, SafeDatePipe],
    templateUrl: './alerts-widget.component.html',
    styleUrl: './alerts-widget.component.scss'
})
export class AlertsWidgetComponent implements OnInit, OnDestroy {
    @Input() patients: Patient[] = [];
    @Output() markAll = new EventEmitter<void>();
    @Output() resolve = new EventEmitter<Patient>();

    viewMode: 'cards' | 'list' = 'cards';
    searchQuery: string = '';
    private destroy$ = new Subject<void>();

    constructor(private searchService: SearchService, private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.searchService.search$.pipe(takeUntil(this.destroy$)).subscribe(term => {
            this.searchQuery = term;
            this.cdr.markForCheck();
        });
    }

    get filteredPatients() {
        if (!this.searchQuery) return this.patients;
        const q = this.searchQuery.toLowerCase();
        return this.patients.filter(p =>
            (p.full_name || '').toLowerCase().includes(q) || (p.id?.toString() || '').includes(q)
        );
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
