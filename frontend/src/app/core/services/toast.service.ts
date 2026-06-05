import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { AppleToastComponent, AppleToastData } from '../../shared/components/apple-toast/apple-toast.component';

@Injectable({
    providedIn: 'root'
})
export class ToastService {

    private defaultConfig: MatSnackBarConfig = {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['apple-glass-overlay']
    };

    constructor(private snackBar: MatSnackBar) { }

    showSuccess(message: string): void {
        this.open(message, 'success');
    }

    showError(message: string): void {
        this.open(message, 'error');
    }

    showInfo(message: string): void {
        this.open(message, 'info');
    }

    showWarning(message: string): void {
        this.open(message, 'warning');
    }

    private open(message: string, type: string): void {
        const panelClass = ['glass-toast', `toast-${type}`];
        this.snackBar.open(message, 'Entendido', {
            ...this.defaultConfig,
            panelClass: panelClass
        });
    }
}
