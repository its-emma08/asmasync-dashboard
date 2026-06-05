import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-intervention-success-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
    template: `
    <div class="text-center p-4">
      <div class="mb-4 text-green-500">
        <mat-icon class="text-6xl h-16 w-16">check_circle</mat-icon>
      </div>
      
      <h2 mat-dialog-title class="text-2xl font-bold mb-2">¡Intervención Registrada!</h2>
      
      <mat-dialog-content>
        <p class="text-gray-600 mb-4">La información se ha guardado correctamente en el expediente digital.</p>
        
        <div class="bg-gray-50 p-4 rounded-lg text-left text-sm mb-4">
           <div class="flex justify-between mb-1">
             <span class="font-bold text-gray-500">Paciente ID:</span>
             <span>#{{data.intervention.patientId}}</span>
           </div>
           <div class="flex justify-between mb-1">
             <span class="font-bold text-gray-500">Tipo:</span>
             <span>{{ getFormatType(data.intervention.type) }}</span>
           </div>
           <div class="flex justify-between">
             <span class="font-bold text-gray-500">Seguimiento:</span>
             <span>{{ data.intervention.nextFollowUp | date:'shortDate' }}</span>
           </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="center" class="flex flex-col gap-2 w-full">
        <button mat-raised-button class="w-full brand-primary-btn" (click)="close('view-patient')">
          <mat-icon>person</mat-icon> Ver Paciente
        </button>
        <button mat-stroked-button class="w-full brand-primary-stroke" (click)="close('new')">
          <mat-icon>add</mat-icon> Nueva Intervención
        </button>
        <button mat-button class="w-full cancel-btn" (click)="close('close')">Volver al Inicio</button>
      </mat-dialog-actions>
    </div>
  `,
    styles: [`
    mat-dialog-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 0 !important;
        padding-bottom: 0 !important;
    }
    .brand-primary-btn {
        background: var(--brand-primary) !important;
        color: white !important;
        border-radius: 12px !important;
        height: 44px !important;
        font-weight: 700 !important;
        box-shadow: 0 4px 12px var(--brand-primary-shadow) !important;
    }
    .brand-primary-stroke {
        border-color: var(--brand-primary) !important;
        color: var(--brand-primary) !important;
        border-radius: 12px !important;
        height: 44px !important;
        font-weight: 700 !important;
    }
    .cancel-btn {
        color: #8e8e93 !important;
        font-weight: 600 !important;
    }
    .dark .cancel-btn {
        color: #cbd5e1 !important;
    }
  `]
})
export class InterventionSuccessDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<InterventionSuccessDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    close(action: string): void {
        this.dialogRef.close(action);
    }

    getFormatType(type: string): string {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}
