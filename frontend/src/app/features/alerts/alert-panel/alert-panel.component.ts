import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AlertService } from '../../../core/services/alert.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { Alert } from '../../../core/models/alert.model';

@Component({
    selector: 'app-alert-panel',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatToolbarModule,
        MatChipsModule,
        MatListModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './alert-panel.component.html',
    styleUrls: ['./alert-panel.component.scss']
})
export class AlertPanelComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    alerts: Alert[] = [];
    filteredAlerts: Alert[] = [];
    loading = true;
    activeFilter = 'all'; // 'all', 'critical', 'moderate', 'unread'

    constructor(
        private alertService: AlertService,
        private wsService: WebSocketService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.requestNotificationPermission();
        this.loadAlerts();
        this.setupRealtimeUpdates();
    }

    requestNotificationPermission(): void {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }

    loadAlerts(): void {
        this.loading = true;
        this.alertService.getAlerts()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.alerts = data;
                    this.filter(this.activeFilter);
                    this.loading = false;
                },
                error: (err) => {
                    console.error(err);
                    this.loading = false;
                }
            });
    }

    setupRealtimeUpdates(): void {
        this.wsService.messages$
            .pipe(takeUntil(this.destroy$))
            .subscribe((msg) => {
                if (msg.type === 'new_alert') {
                    // Add new alert to top
                    const newAlert: Alert = msg.data;
                    this.alerts.unshift(newAlert);
                    this.filter(this.activeFilter);

                    if (newAlert.type === 'critical') {
                        this.showBrowserNotification(newAlert);
                    }
                }
            });
    }

    showBrowserNotification(alert: Alert): void {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('AsmaSync - Alerta Crítica', {
                body: `${alert.patientName}: ${alert.message}`,
                icon: '/assets/logo.png', // Assuming logo exists
                tag: 'asmasync-alert',
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                this.router.navigate(['/dashboard/patients', alert.patientId]);
                notification.close();
            };
        }
    }

    filter(type: string): void {
        this.activeFilter = type;
        switch (type) {
            case 'critical':
                this.filteredAlerts = this.alerts.filter(a => a.type === 'critical');
                break;
            case 'moderate':
                this.filteredAlerts = this.alerts.filter(a => a.type === 'moderate');
                break;
            case 'unread':
                this.filteredAlerts = this.alerts.filter(a => !a.isRead);
                break;
            default:
                this.filteredAlerts = this.alerts;
        }
    }

    markAsRead(alert: Alert, event: Event): void {
        event.stopPropagation();
        if (alert.isRead) return;

        this.alertService.markAsRead(alert.id).subscribe(() => {
            alert.isRead = true;
            this.filter(this.activeFilter); // Refresh filter just in case 'unread' is active
        });
    }

    markAllAsRead(): void {
        // In real app, implementing a bulk endpoint in service is better. 
        // For now, iterate or minimal implementation
        const unread = this.alerts.filter(a => !a.isRead);
        unread.forEach(a => {
            this.alertService.markAsRead(a.id).subscribe(() => a.isRead = true);
        });
    }

    navigateToPatient(patientId: number): void {
        this.router.navigate(['/dashboard/patients', patientId]);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
