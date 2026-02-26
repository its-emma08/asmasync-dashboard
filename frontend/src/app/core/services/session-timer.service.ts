import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, fromEvent, merge, timer } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class SessionTimerService {

    private lastActivity: number = Date.now();
    private readonly TIMEOUT_MINUTES = 5;
    private readonly CHECK_INTERVAL = 10000; // Check every 10s
    private timer: any;
    private warningShown = false;

    constructor(
        private router: Router,
        private ngZone: NgZone,
        private snackBar: MatSnackBar,
        private storageService: StorageService
    ) { }

    startMonitoring() {
        this.ngZone.runOutsideAngular(() => {
            // Listen to events to reset timer
            merge(
                fromEvent(document, 'mousemove'),
                fromEvent(document, 'keydown'),
                fromEvent(document, 'click'),
                fromEvent(document, 'scroll')
            ).pipe(
                throttleTime(1000)
            ).subscribe(() => {
                this.resetTimer();
            });

            // Start check interval
            this.timer = setInterval(() => {
                this.checkIdleTime();
            }, this.CHECK_INTERVAL);
        });
    }

    private resetTimer() {
        this.lastActivity = Date.now();
        if (this.warningShown) {
            this.ngZone.run(() => {
                this.snackBar.dismiss();
                this.warningShown = false;
            });
        }
    }

    private checkIdleTime() {
        const idleTime = Date.now() - this.lastActivity;
        const timeoutMs = this.TIMEOUT_MINUTES * 60 * 1000;
        const warningThreshold = timeoutMs - (30 * 1000); // Warn 30s before

        if (idleTime > timeoutMs) {
            this.logout();
        } else if (idleTime > warningThreshold && !this.warningShown) {
            this.ngZone.run(() => {
                this.warningShown = true;
                this.snackBar.open('Tu sesión expirará en 30 segundos por inactividad.', 'Mantener Sesión', {
                    duration: 30000
                }).onAction().subscribe(() => {
                    this.resetTimer();
                });
            });
        }
    }

    private logout() {
        clearInterval(this.timer);
        this.ngZone.run(() => {
            // BUG-001 fix: route is /login, not /auth/login
            // BUG-004 fix: use storageService.clear() not raw localStorage.clear()
            this.storageService.clear();
            this.snackBar.open('Sesión cerrada por inactividad.', 'OK', { duration: 5000 });
            this.router.navigate(['/login']);
        });
    }
}
