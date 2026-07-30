import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, TimeoutError, throwError, timer } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { ToastService } from '../services/toast.service';
import { SKIP_RESILIENCE } from './http-context.tokens';

const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

@Injectable()
export class RenderResilienceInterceptor implements HttpInterceptor {
  constructor(private toast: ToastService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (request.context.get(SKIP_RESILIENCE)) {
      return next.handle(request);
    }

    // attempt$ is defined separately so retry resubscribes to it,
    // which recreates the timeout operator fresh on every attempt.
    const attempt$ = next.handle(request).pipe(timeout(TIMEOUT_MS));

    return attempt$.pipe(
      retry({
        count: MAX_RETRIES,
        delay: (error, retryCount) => {
          const isRetryable =
            error instanceof TimeoutError ||
            error?.status === 0 ||
            error?.status === 502 ||
            error?.status === 504;

          if (!isRetryable) {
            return throwError(() => error);
          }

          if (error?.status === 504 || error?.status === 502) {
            const msg = error.status === 504
              ? 'La nube de AsmaSync está despertando, espera un momento...'
              : 'Conexión inestable con Render. Reintentando...';
            this.toast.showInfo(msg);
          }

          return timer(500 * Math.pow(2, retryCount - 1)); // 500ms → 1s
        }
      }),
      catchError((error: HttpErrorResponse | TimeoutError) => {
        const status = (error as HttpErrorResponse).status;

        if (![403, 404].includes(status)) {
          console.error(`[ResilienceInterceptor] ${error.message}`);
        }

        let userMessage: string | null = null;

        if (error instanceof TimeoutError) {
          userMessage = 'El servidor tardó demasiado en responder. Intenta de nuevo.';
        } else if (status === 504) {
          userMessage = 'La nube de AsmaSync está tardando en responder (servidor dormido).';
        } else if (status === 502) {
          userMessage = 'Error de conexión con el servidor de Render.';
        } else if (status === 0) {
          userMessage = 'No se pudo contactar al servidor. Revisa tu conexión.';
        }

        if (userMessage) {
          this.toast.showError(userMessage);
        }

        return throwError(() => error);
      })
    );
  }
}
