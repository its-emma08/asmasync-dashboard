import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-iot-connection',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        RouterModule
    ],
    templateUrl: './iot-connection.component.html'
})
export class IotConnectionComponent {
    currentStep = 0;
    selectedDeviceType: string = '';
    selectedDeviceName: string = '';

    deviceNames: { [key: string]: string } = {
        'pef': 'Smart Spirometer X2',
        'inhaler': 'Propeller Health Sensor',
        'oximeter': 'Nonin 3230 Pulse',
        'smartwatch': 'Apple Watch Series 9'
    };

    selectDevice(type: string) {
        this.selectedDeviceType = type;
        this.selectedDeviceName = this.deviceNames[type] || 'Dispositivo Desconocido';

        if (type === 'smartwatch') {
            this.currentStep = 4; // Special step for Smartwatch (Permissions)
        } else {
            this.nextStep();
            // Mock Scanning Delay for other devices
            if (this.currentStep === 1) {
                // Wait for user to click connect in UI
            }
        }
    }

    connectDevice() {
        this.nextStep(); // To Step 2 (Connecting)

        // Mock Connection Delay
        setTimeout(() => {
            this.nextStep(); // To Step 3 (Success)
        }, 2000);
    }

    nextStep() {
        if (this.currentStep < 3) {
            this.currentStep++;
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
        }
    }

    reset() {
        this.currentStep = 0;
        this.selectedDeviceType = '';
    }
}
