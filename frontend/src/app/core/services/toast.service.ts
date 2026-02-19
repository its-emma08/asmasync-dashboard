import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root'
})
export class ToastService {

    private defaultConfig: MatSnackBarConfig = {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['glass-toast']
    };

    constructor(private snackBar: MatSnackBar) { }

    showSuccess(message: string): void {
        this.open(`✅ ${message}`, 'toast-success');
    }

    showError(message: string): void {
        this.open(`❌ ${message}`, 'toast-error');
    }

    showInfo(message: string): void {
        this.open(`ℹ️ ${message}`, 'toast-info');
    }

    showWarning(message: string): void {
        this.open(`⚠️ ${message}`, 'toast-warning');
    }

    private open(message: string, typeClass: string): void {
        this.snackBar.open(message, 'OK', {
            ...this.defaultConfig,
            panelClass: ['glass-toast', typeClass]
        });
    }
}
