import { ErrorHandler, Injectable, Injector, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    constructor(
        private injector: Injector,
        private zone: NgZone
    ) { }

    handleError(error: any) {
        const snackBar = this.injector.get(MatSnackBar);

        console.error('[GlobalErrorHandler]', error);

        this.zone.run(() => {
            let userMessage = 'Ops! Algo salió mal. Por favor intenta de nuevo.';
            
            if (error instanceof HttpErrorResponse) {
                if (error.status === 0) {
                    userMessage = 'No hay conexión con el servidor. Verifica tu internet.';
                } else if (error.status >= 500) {
                    userMessage = 'Error en el servidor. Nuestro equipo ya está trabajando en ello.';
                }
            }

            snackBar.open(userMessage, 'Cerrar', {
                duration: 5000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
                panelClass: ['error-snackbar']
            });
        });
    }
}
