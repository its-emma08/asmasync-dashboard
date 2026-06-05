import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, catchError, of } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { MeasurementService } from '../../../../../core/services/measurement.service';

@Component({
  selector: 'app-device-status-widget',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatRippleModule, MatTooltipModule],
  templateUrl: './device-status-widget.component.html',
  styleUrls: ['./device-status-widget.component.scss']
})
export class DeviceStatusWidgetComponent implements OnInit, OnDestroy {
  devices: any[] = [];
  primaryDevice: any = null;
  isConnected = false;
  lastSyncTime: string = '—';
  isLoading = true;

  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient, private measurementService: MeasurementService) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/devices`).pipe(
      catchError(() => of([])),
      takeUntil(this.destroy$)
    ).subscribe(devices => {
      this.devices = devices || [];
      this.primaryDevice = this.devices.find(d => d.is_active) || this.devices[0] || null;
      this.isLoading = false;
    });

    this.measurementService.isConnected$.pipe(takeUntil(this.destroy$)).subscribe(connected => {
      this.isConnected = connected;
      if (connected) {
        this.lastSyncTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      }
    });
  }

  getDeviceIcon(type: string): string {
    if (!type) return 'sensors';
    if (type.includes('watch') || type.includes('smartwatch')) return 'watch';
    if (type.includes('spirometer')) return 'air';
    if (type.includes('inhaler')) return 'medication';
    return 'sensors';
  }

  getDeviceName(device: any): string {
    if (!device) return 'Sin dispositivo';
    const brand = device.device_brand || '';
    const model = device.device_model || device.device_type || 'Dispositivo';
    return brand ? `${brand} ${model}` : model;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
