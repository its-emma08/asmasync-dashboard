import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Patient } from '../../../../core/models/patient.model';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';
import { AgePipe } from '../../../../shared/pipes/age-pipe';
import * as riskHelper from '../../../../core/utils/risk.helper';

@Component({
    selector: 'app-priority-patients-table',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatTableModule,
        MatIconModule,
        MatButtonModule,
        RelativeTimePipe,
        AgePipe
    ],
    templateUrl: './priority-patients-table.component.html',
    styleUrls: ['./priority-patients-table.component.scss']
})
export class PriorityPatientsTableComponent {
    @Input() patients: Patient[] = [];
    displayedColumns: string[] = ['fullName', 'riskLevel', 'pef', 'lastUpdate', 'tendencia', 'actions'];

    getRiskLabel(level: string): string {
        return riskHelper.getRiskLabel(level);
    }

    getRiskClass(level: string): string {
        return riskHelper.getRiskClass(level);
    }

    /** Derives trend from real PEF data instead of a mock value. */
    getTrend(latest: number, best: number): 'up' | 'stable' | 'down' {
        if (!latest || !best) return 'down';
        const pct = (latest / best) * 100;
        if (pct >= 80) return 'up';
        if (pct >= 50) return 'stable';
        return 'down';
    }

    getTrendIcon(latest: number, best: number): string {
        const t = this.getTrend(latest, best);
        return t === 'up' ? 'trending_up' : t === 'stable' ? 'trending_flat' : 'trending_down';
    }

    getTrendColor(latest: number, best: number): string {
        const t = this.getTrend(latest, best);
        return t === 'up' ? 'text-brand-green' : t === 'stable' ? 'text-yellow-500' : 'text-brand-coral';
    }

    getTrendLabel(latest: number, best: number): string {
        if (!best || best === 0) return '--';
        const pct = Math.round((latest / best) * 100);
        return `${pct}%`;
    }

    getPefDrop(current: number, best: number): number {
        if (!best || best === 0) return 0;
        const drop = ((best - current) / best) * 100;
        return Math.max(0, Math.round(drop));
    }
}
