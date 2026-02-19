import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    constructor(private injector: Injector) { }

    handleError(error: Error | HttpErrorResponse) {
        const snackBar = this.injector.get(MatSnackBar);

        if (error instanceof HttpErrorResponse) {
            // Error del servidor
            console.error('Error HTTP:', error);
            snackBar.open(
                `Error del servidor: ${error.message}`,
                'Cerrar',
                { duration: 5000, panelClass: ['error-snackbar'] }
            );
        } else {
            // Error del cliente
            console.error('Error de aplicación:', error);

            // En desarrollo, mostrar error completo
            // En producción, mensaje genérico
            const message = error.message ? error.message : error.toString();

            if (!environment.production) {
                snackBar.open(
                    `Error: ${message}`,
                    'Cerrar',
                    //   { duration: 10000, panelClass: ['error-snackbar'] }
                    { duration: 5000 }
                );
            } else {
                snackBar.open(
                    'Ha ocurrido un error. Por favor, intenta nuevamente.',
                    'Cerrar',
                    { duration: 5000 }
                );
            }
        }
    }
}
