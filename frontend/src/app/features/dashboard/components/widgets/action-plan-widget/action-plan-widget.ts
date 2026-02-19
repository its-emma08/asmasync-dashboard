import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-action-plan-widget',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './action-plan-widget.html',
  styleUrls: ['./action-plan-widget.scss']
})
export class ActionPlanWidgetComponent {
  @Input() riskLevel: 'green' | 'yellow' | 'red' = 'green';
  @Input() personalBest: number = 0;
  @Input() currentPEF: number = 0;

  get greenZoneMin(): number { return Math.round(this.personalBest * 0.8); }
  get yellowZoneMin(): number { return Math.round(this.personalBest * 0.5); }

  get instructions(): any {
    return {
      green: {
        title: 'ZONA VERDE',
        subtitle: 'Control Total',
        action: 'Mantener tratamiento actual.',
        condition: `PEF > ${this.greenZoneMin} L/min`
      },
      yellow: {
        title: 'ZONA AMARILLA',
        subtitle: 'Precaución',
        action: 'Usar inhalador de rescate (2 disparos). Revaluar en 20 min.',
        condition: `PEF ${this.yellowZoneMin} - ${this.greenZoneMin} L/min`
      },
      red: {
        title: 'ZONA ROJA',
        subtitle: 'EMERGENCIA',
        action: 'ALERTA MÉDICA. Acudir a urgencias.',
        condition: `PEF < ${this.yellowZoneMin} L/min`
      }
    };
  }

  isActive(zone: string): boolean {
    return this.riskLevel === zone;
  }
}
