import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-iot-connection',
    standalone: true,
    imports: [
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        RouterModule
    ],
    templateUrl: './iot-connection.component.html'
})
export class IotConnectionComponent {
    private http = inject(HttpClient);

    currentStep = 0;
    selectedDeviceType: string = '';
    selectedDeviceName: string = '';
    connectError = '';

    // Mapeo tipo → metadatos del dispositivo
    private deviceMeta: { [key: string]: { name: string; brand: string; model: string } } = {
        'pef':        { name: 'Smart Spirometer X2',     brand: 'Vitalograph',  model: 'COPD-6'       },
        'inhaler':    { name: 'Propeller Health Sensor',  brand: 'Propeller',    model: 'PHS-1'        },
        'oximeter':   { name: 'Nonin 3230 Pulse',         brand: 'Nonin',        model: '3230'         },
        'smartwatch': { name: 'Apple Watch Series 9',     brand: 'Apple',        model: 'Watch S9'     }
    };

    get selectedMeta() {
        return this.deviceMeta[this.selectedDeviceType] ?? { name: 'Dispositivo', brand: '', model: '' };
    }

    selectDevice(type: string) {
        this.selectedDeviceType = type;
        this.selectedDeviceName = this.deviceMeta[type]?.name || 'Dispositivo Desconocido';
        this.connectError = '';

        if (type === 'smartwatch') {
            this.currentStep = 4;
        } else {
            this.nextStep();
        }
    }

    connectDevice() {
        this.currentStep = 2; // mostramos "conectando..."
        this.connectError = '';

        const meta = this.selectedMeta;
        const payload = {
            device_type:  this.selectedDeviceType,
            device_brand: meta.brand,
            device_model: meta.model,
        };

        this.http.post(`${environment.apiUrl}/devices`, payload)
            .pipe(catchError(err => {
                // Si el dispositivo ya estaba registrado (400) lo tratamos como OK
                if (err?.status === 400) return of({ already_registered: true });
                this.connectError = err?.error?.detail || 'No se pudo registrar el dispositivo.';
                this.currentStep = 1; // volver al paso anterior
                return of(null);
            }))
            .subscribe(res => {
                if (res !== null) {
                    this.currentStep = 3; // éxito
                }
            });
    }

    nextStep() {
        if (this.currentStep < 3) this.currentStep++;
    }

    prevStep() {
        if (this.currentStep > 0) this.currentStep--;
    }

    reset() {
        this.currentStep = 0;
        this.selectedDeviceType = '';
        this.connectError = '';
    }
}
