import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PatientService } from '../../../../../core/services/patient.service';
import { getRiskPriority } from '../../../../../core/utils/risk.helper';

@Component({
  selector: 'app-medication-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressBarModule, RouterModule],
  templateUrl: './medication-widget.component.html',
  styleUrls: ['./medication-widget.component.scss']
})
export class MedicationWidgetComponent implements OnInit, OnDestroy {
  medications: { name: string; patient: string; riskLevel: string }[] = [];
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(private patientService: PatientService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.patientService.patients$.pipe(takeUntil(this.destroy$)).subscribe(patients => {
      const meds: { name: string; patient: string; riskLevel: string }[] = [];
      const sorted = [...patients].sort((a, b) => {
        return getRiskPriority(b.riskLevel) - getRiskPriority(a.riskLevel);
      });
      for (const p of sorted.slice(0, 5)) {
        if (p.current_medications) {
          p.current_medications.split(',').forEach(med => {
            const name = med.trim();
            if (name) meds.push({ name, patient: p.full_name, riskLevel: p.riskLevel });
          });
        }
      }
      this.medications = meds.slice(0, 6);
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
