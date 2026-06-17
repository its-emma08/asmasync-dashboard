// frontend/src/app/shared/components/emergency-protocol/emergency-protocol.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-emergency-protocol',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  template: `
    <div class="emergency-modal">
      <div class="emergency-header">
        <mat-icon class="pulse">warning</mat-icon>
        <h1>PROTOCOLO DE EMERGENCIA</h1>
      </div>
      <div class="emergency-body">
        <p class="warning-text">Se ha detectado una caída crítica en el flujo pulmonar (< 50%).</p>
        <div class="steps-container">
          <div class="step">
            <span class="step-num">1</span>
            <p>Use su inhalador de rescate (Salbutamol) inmediatamente.</p>
          </div>
          <div class="step">
            <span class="step-num">2</span>
            <p>Siéntese derecho e intente mantener la calma.</p>
          </div>
          <div class="step">
            <span class="step-num">3</span>
            <p>Contacte a emergencias o a su médico si no hay mejoría en 5 minutos.</p>
          </div>
        </div>
      </div>
      <div class="emergency-footer">
        <button mat-flat-button color="warn" (click)="close()">ENTENDIDO</button>
      </div>
    </div>
  `,
  styles: [`
    .emergency-modal { padding: 32px; text-align: center; border-radius: 24px; }
    .emergency-header { color: #ef4444; margin-bottom: 24px; }
    .emergency-header mat-icon { font-size: 64px; width: 64px; height: 64px; }
    .emergency-header h1 { font-size: 24px; font-weight: 900; margin-top: 16px; letter-spacing: 1px; }
    .warning-text { font-weight: 700; color: #1e293b; margin-bottom: 32px; }
    .steps-container { text-align: left; background: #fef2f2; padding: 24px; border-radius: 16px; border: 1px solid #fee2e2; }
    .step { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .step:last-child { margin-bottom: 0; }
    .step-num { width: 28px; height: 28px; border-radius: 50%; background: #ef4444; color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; flex-shrink: 0; }
    .step p { margin: 0; font-size: 15px; color: #7f1d1d; font-weight: 600; }
    .emergency-footer { margin-top: 32px; }
    .emergency-footer button { width: 100%; border-radius: 12px; height: 48px; font-weight: 700; }
    @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
    .pulse { animation: pulse 1.5s infinite; }
  `]
})
export class EmergencyProtocolComponent {
  constructor(public dialogRef: MatDialogRef<EmergencyProtocolComponent>) {}
  close() { this.dialogRef.close(); }
}
