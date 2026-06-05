import { Component, Input, OnChanges, SimpleChanges, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActionPlanService, ActionPlan } from '../../../../../core/services/action-plan.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-action-plan-widget',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './action-plan-widget.html',
  styleUrls: ['./action-plan-widget.scss']
})
export class ActionPlanWidgetComponent implements OnChanges, OnDestroy {
  @Input() riskLevel: string = 'low';
  @Input() personalBest: number = 0;
  @Input() currentPEF: number = 0;
  @Input() patientId: number | null = null;

  private readonly riskToZone: Record<string, string> = {
    high: 'red',
    moderate: 'yellow',
    low: 'green',
    unknown: 'green',
  };

  private actionPlanService = inject(ActionPlanService);
  private destroy$ = new Subject<void>();

  plan: ActionPlan | null = null;
  loading = false;

  get activeZone(): string {
    return this.riskToZone[this.riskLevel] ?? 'green';
  }

  get greenZoneMin(): number { return Math.round(this.personalBest * 0.8); }
  get yellowZoneMin(): number { return Math.round(this.personalBest * 0.5); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && this.patientId) {
      this.loadPlan();
    }
  }

  private loadPlan(): void {
    this.loading = true;
    this.actionPlanService.getForPatient(this.patientId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ plan }) => {
          this.plan = plan;
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  get instructions(): any {
    return {
      green: {
        title: 'ZONA VERDE',
        subtitle: 'Control Total',
        condition: `PEF > ${this.greenZoneMin} L/min`,
        action: this.plan?.green_zone_instructions || 'Mantener tratamiento actual.'
      },
      yellow: {
        title: 'ZONA AMARILLA',
        subtitle: 'Precaución',
        condition: `PEF ${this.yellowZoneMin}–${this.greenZoneMin} L/min`,
        action: this.plan?.yellow_zone_instructions || 'Usar inhalador de rescate (2 disparos). Revaluar en 20 min.'
      },
      red: {
        title: 'ZONA ROJA',
        subtitle: 'EMERGENCIA',
        condition: `PEF < ${this.yellowZoneMin} L/min`,
        action: this.plan?.red_zone_instructions || 'ALERTA MÉDICA. Acudir a urgencias.'
      }
    };
  }

  isActive(zone: string): boolean {
    return this.activeZone === zone;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
