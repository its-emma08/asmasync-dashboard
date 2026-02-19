import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Patient } from '../../../../core/models/patient.model';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';
import { AgePipe } from '../../../../shared/pipes/age-pipe';

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
        switch (level) {
            case 'red': return 'Crítico';
            case 'yellow': return 'Moderado';
            case 'green': return 'Bajo';
            default: return level;
        }
    }

    getRiskClass(level: string): string {
        switch (level) {
            case 'red': return 'bg-red-50 text-brand-coral border border-red-100';
            case 'yellow': return 'bg-yellow-50 text-[#FFB547] border border-yellow-100';
            case 'green': return 'bg-green-50 text-brand-green border border-green-100';
            default: return 'bg-gray-50 text-gray-500';
        }
    }

    getTrendIcon(trend: string): string {
        return 'arrow_downward'; // Mock logic, ideally comes from backend/model
    }

    getTrendColor(trend: string): string {
        return 'text-brand-coral'; // Mock logic
    }

    getPefDrop(current: number, best: number): number {
        if (!best || best === 0) return 0;
        const drop = ((best - current) / best) * 100;
        return Math.max(0, Math.round(drop));
    }
}
