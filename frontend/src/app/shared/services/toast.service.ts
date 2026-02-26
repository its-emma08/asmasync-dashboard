import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root'
})
export class ToastService {

    constructor(private snackBar: MatSnackBar) { }

    show(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000): void {
        const config: MatSnackBarConfig = {
            duration: duration,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['glass-toast', `toast-${type}`]
        };

        this.snackBar.open(message, 'OK', config);
    }

    success(message: string): void {
        this.show(message, 'success');
    }

    error(message: string): void {
        this.show(message, 'error', 5000);
    }

    info(message: string): void {
        this.show(message, 'info');
    }
}
