import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type KpiVariant = 'blue' | 'red' | 'green' | 'yellow' | 'orange';

@Component({
    selector: 'app-kpi-card',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './kpi-card.component.html',
    styleUrls: ['./kpi-card.component.scss']
})
export class KpiCardComponent {
    @Input() title: string = '';
    @Input() value: string | number = 0;
    @Input() icon: string = 'analytics';
    @Input() variant: KpiVariant = 'blue';
    @Input() trendValue: string = '';
    @Input() trendDirection: 'up' | 'down' = 'up'; // 'neutral'

    get iconBgClass(): string {
        switch (this.variant) {
            case 'blue': return 'bg-[#F4F7FE]';
            case 'red': return 'bg-[#FFF2F2]';
            case 'green': return 'bg-[#ECFDF5]';
            case 'yellow': return 'bg-[#FFF7EC]';
            case 'orange': return 'bg-[#FFF7EC]'; // Same as yellow for now
            default: return 'bg-[#F4F7FE]';
        }
    }

    get iconColorClass(): string {
        switch (this.variant) {
            case 'blue': return 'text-brand-cyan';
            case 'red': return 'text-brand-coral';
            case 'green': return 'text-brand-green';
            case 'yellow': return 'text-[#FFB547]';
            case 'orange': return 'text-[#FFB547]';
            default: return 'text-brand-cyan';
        }
    }

    get trendColorClass(): string {
        return this.trendDirection === 'up' ? 'text-green-500' : 'text-red-500';
    }

    get trendBgClass(): string {
        return this.trendDirection === 'up' ? 'bg-green-50' : 'bg-red-50';
    }
}
