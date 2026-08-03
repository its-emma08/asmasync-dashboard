// frontend/src/app/shared/components/emergency-protocol/emergency-protocol.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

export interface EmergencyProtocolData {
  patientName?: string;
  patientId?: number | string;
  pefValue?: number;
  pefPercent?: number;
  probability?: number;
  phone?: string;
}

@Component({
  selector: 'app-emergency-protocol',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  template: `
    <div class="emergency-modal">
      <!-- Animated Alert Header -->
      <div class="emergency-header">
        <div class="icon-ring">
          <mat-icon class="pulse-icon">emergency</mat-icon>
        </div>
        <div class="header-text">
          <span class="badge">ALERTA CRÍTICA</span>
          <h1>Protocolo de Emergencia</h1>
          <p class="patient-name" *ngIf="data.patientName">
            <mat-icon>person</mat-icon> {{ data.patientName }}
          </p>
        </div>
      </div>

      <!-- Risk Data Strip -->
      <div class="risk-strip" *ngIf="data && (data.pefPercent || data.pefValue)">
        <div class="risk-metric">
          <span class="metric-label">PEF Actual</span>
          <span class="metric-value red">{{ data.pefValue ?? '—' }} <small>L/min</small></span>
        </div>
        <div class="risk-divider"></div>
        <div class="risk-metric">
          <span class="metric-label">% Zona Normal</span>
          <span class="metric-value red">{{ data.pefPercent ?? '—' }}<small>%</small></span>
        </div>
        <div class="risk-divider"></div>
        <div class="risk-metric">
          <span class="metric-label">Prob. Crisis</span>
          <span class="metric-value red">{{ data.probability ? ((data.probability || 0) * 100 | number:'1.0-0') + '%' : '—' }}</span>
        </div>
      </div>


      <!-- Steps -->
      <div class="steps-container">
        <p class="warning-text">Se detectó caída crítica del flujo pulmonar (&lt; 50% zona verde GINA).</p>
        <div class="step">
          <span class="step-num">1</span>
          <p>Usar inhalador de rescate (Salbutamol) <strong>inmediatamente</strong>.</p>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <p>Posición sentada derecha, respiraciones lentas y profundas.</p>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <p>Contactar al médico tratante si no hay mejoría en 5 minutos.</p>
        </div>
        <div class="step">
          <span class="step-num">4</span>
          <p>Si persiste el deterioro, llamar a <strong>911</strong> sin demora.</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="emergency-footer">
        <button *ngIf="data.phone" class="action-btn call-btn" (click)="callPatient()">
          <mat-icon>phone</mat-icon> Llamar al Paciente
        </button>
        <button *ngIf="data.patientId" class="action-btn intervention-btn" (click)="registerIntervention()">
          <mat-icon>medical_services</mat-icon> Registrar Intervención
        </button>
        <button class="action-btn dismiss-btn" (click)="close()">
          <mat-icon>check_circle</mat-icon> Entendido
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .emergency-modal {
      background: #fff;
      border-radius: 24px;
      overflow: hidden;
    }

    /* ── Header ── */
    .emergency-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 28px 20px;
      background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
      color: white;
    }

    .icon-ring {
      width: 56px; height: 56px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      backdrop-filter: blur(8px);
      border: 2px solid rgba(255,255,255,0.3);
    }

    .pulse-icon {
      font-size: 30px; width: 30px; height: 30px;
      animation: pulse 1.2s ease-in-out infinite;
    }

    .header-text { flex: 1; }

    .badge {
      display: inline-block;
      font-size: 10px; font-weight: 800;
      letter-spacing: 0.15em;
      background: rgba(255,255,255,0.25);
      border-radius: 999px;
      padding: 2px 10px;
      margin-bottom: 6px;
    }

    .header-text h1 {
      font-size: 20px; font-weight: 900; margin: 0 0 4px;
      letter-spacing: -0.02em;
    }

    .patient-name {
      display: flex; align-items: center; gap: 4px;
      font-size: 13px; font-weight: 600;
      opacity: 0.9; margin: 0;
    }

    .patient-name mat-icon { font-size: 15px; width: 15px; height: 15px; }

    /* ── Risk Strip ── */
    .risk-strip {
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 16px 28px;
      background: rgba(239, 68, 68, 0.05);
      border-bottom: 1px solid rgba(239, 68, 68, 0.12);
    }

    .risk-metric { text-align: center; }

    .metric-label {
      display: block; font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: #94a3b8; margin-bottom: 4px;
    }

    .metric-value {
      font-size: 22px; font-weight: 800; letter-spacing: -0.03em;
      display: flex; align-items: baseline; gap: 2px;
    }

    .metric-value.red { color: #ef4444; }

    .metric-value small {
      font-size: 11px; font-weight: 600; opacity: 0.7;
    }

    .risk-divider {
      width: 1px; height: 40px;
      background: rgba(239, 68, 68, 0.15);
    }

    /* ── Steps ── */
    .steps-container {
      padding: 20px 28px;
    }

    .warning-text {
      font-size: 13px; font-weight: 600; color: #64748b;
      margin: 0 0 16px;
      padding: 10px 14px;
      background: rgba(239, 68, 68, 0.05);
      border-radius: 10px;
      border-left: 3px solid #ef4444;
    }

    .step {
      display: flex; align-items: flex-start; gap: 14px;
      margin-bottom: 12px;
    }

    .step:last-child { margin-bottom: 0; }

    .step-num {
      width: 26px; height: 26px; flex-shrink: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, #ef4444, #b91c1c);
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: 13px;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.35);
    }

    .step p {
      margin: 0; font-size: 14px; color: #374151; line-height: 1.5;
    }

    /* ── Footer ── */
    .emergency-footer {
      padding: 16px 28px 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      border-top: 1px solid rgba(0,0,0,0.06);
    }

    .action-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      border-radius: 14px; height: 48px;
      font-size: 14px; font-weight: 700;
      border: none; cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .call-btn {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
    }

    .call-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); }

    .intervention-btn {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
    }

    .intervention-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4); }

    .dismiss-btn {
      background: #f1f5f9;
      color: #64748b;
    }

    .dismiss-btn:hover { background: #e2e8f0; }

    @keyframes pulse {
      0%   { transform: scale(1);    opacity: 1;   }
      50%  { transform: scale(1.18); opacity: 0.75; }
      100% { transform: scale(1);    opacity: 1;   }
    }
  `]
})
export class EmergencyProtocolComponent {
  constructor(
    public dialogRef: MatDialogRef<EmergencyProtocolComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmergencyProtocolData,
    private router: Router
  ) {}

  close() { this.dialogRef.close(); }

  callPatient() {
    if (this.data?.phone) {
      window.open(`tel:${this.data.phone}`, '_self');
    }
  }

  registerIntervention() {
    this.dialogRef.close();
    this.router.navigate(['/dashboard/interventions/new'], {
      queryParams: { patientId: this.data?.patientId }
    });
  }
}
