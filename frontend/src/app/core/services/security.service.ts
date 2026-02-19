import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AuditLogEntry {
    timestamp: Date;
    action: string;
    details: string;
    status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

@Injectable({
    providedIn: 'root'
})
export class SecurityService {

    private failedAttempts = 0;
    private lockoutUntil: Date | null = null;
    private auditLog: AuditLogEntry[] = [];

    // Observable for UI countdown
    lockoutTimeRemaining$ = new BehaviorSubject<number>(0);

    constructor() {
        // Check if previously locked out (simulate persistence if needed, but in-memory for now)
        this.startCountdownTimer();
    }

    recordLoginAttempt(success: boolean, username: string): void {
        if (success) {
            this.failedAttempts = 0;
            this.lockoutUntil = null;
            this.log('LOGIN', `User ${username} logged in successfully`, 'SUCCESS');
        } else {
            this.failedAttempts++;
            this.log('LOGIN', `Failed login attempt for ${username}`, 'FAILURE');

            if (this.failedAttempts >= 3) {
                this.lockoutUser(30); // 30 seconds
            }
        }
    }

    private lockoutUser(seconds: number): void {
        this.lockoutUntil = new Date(Date.now() + seconds * 1000);
        this.log('SECURITY', `User locked out due to excessive failures`, 'WARNING');
        this.lockoutTimeRemaining$.next(seconds);
    }

    isLocked(): boolean {
        if (!this.lockoutUntil) return false;
        return new Date() < this.lockoutUntil;
    }

    getAuditLog(): AuditLogEntry[] {
        return this.auditLog;
    }

    log(action: string, details: string, status: 'SUCCESS' | 'FAILURE' | 'WARNING'): void {
        this.auditLog.unshift({
            timestamp: new Date(),
            action,
            details,
            status
        });
        // console.log(`[SECURITY AUDIT] ${action}: ${details}`);
    }

    private startCountdownTimer() {
        setInterval(() => {
            if (this.lockoutUntil) {
                const remaining = Math.max(0, Math.ceil((this.lockoutUntil.getTime() - Date.now()) / 1000));
                this.lockoutTimeRemaining$.next(remaining);
                if (remaining === 0) {
                    this.lockoutUntil = null;
                    this.failedAttempts = 0; // Reset after lockout
                }
            }
        }, 1000);
    }
}
