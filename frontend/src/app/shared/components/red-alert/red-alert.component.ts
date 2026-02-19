import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-red-alert',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './red-alert.component.html',
    styles: [`
    .blink { animation: blinker 1s linear infinite; }
    @keyframes blinker { 50% { opacity: 0; } }
  `]
})
export class RedAlertComponent {
    step = 1;
    timer = 60;
    interval: any;
    spo2Reading: number | null = null;

    constructor(
        public dialogRef: MatDialogRef<RedAlertComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    nextStep() {
        if (this.step === 1) {
            this.step = 2;
            this.startOximeterSimulation();
        } else {
            this.dialogRef.close({ action: 'resolved', spo2: this.spo2Reading });
        }
    }

    callEmergency() {
        this.dialogRef.close({ action: 'emergency' });
    }

    startOximeterSimulation() {
        // Simulate reading from device
        let progress = 0;
        const simInterval = setInterval(() => {
            progress += 10;
            if (progress >= 100) {
                clearInterval(simInterval);
                this.spo2Reading = 92 + Math.floor(Math.random() * 6); // Random 92-98
            }
        }, 500);
    }
}
