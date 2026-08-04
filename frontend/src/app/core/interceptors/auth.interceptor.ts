import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(
        private authService: AuthService,
        private toastService: ToastService
    ) { }

    private getSupabaseToken(): string | null {
        try {
            const projectRef = new URL(environment.supabaseUrl).hostname.split('.')[0];
            const raw = localStorage.getItem(`sb-${projectRef}-auth-token`);
            if (!raw) return null;
            return JSON.parse(raw)?.access_token ?? null;
        } catch {
            return null;
        }
    }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const url = request.url;

        // Servicios externos — no inyectar token ni headers propios
        const isExternalService =
            url.includes('supabase.co/rest') ||
            url.includes('openweathermap.org') ||
            url.includes('open-meteo.com') ||
            url.includes('api.waqi.info') ||
            url.includes('tomorrow.io') ||
            url.includes('air-quality-api.open-meteo.com');

        if (isExternalService) {
            return next.handle(request);
        }

        // Todo lo demás es nuestra API (local en dev, Render en prod)
        const isOurApi =
            url.includes('onrender.com') ||
            url.startsWith(environment.apiUrl);

        if (!isOurApi) {
            return next.handle(request);
        }

        // Token: primero el de Pablo (access_token), fallback al de Supabase
        const localToken = this.authService.getToken();
        const supabaseToken = this.getSupabaseToken();
        const token = localToken ?? supabaseToken;

        let headers = request.headers;

        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        return next.handle(request.clone({ headers })).pipe(
            catchError((error: HttpErrorResponse) => {
                // No cerrar sesión en 401 de flujos de autenticación: ahí un 401 es
                // un "credenciales incorrectas" o "código inválido", no sesión expirada.
                const isAuthEndpoint =
                    url.includes('/auth/register') ||
                    url.includes('/auth/login') ||
                    url.includes('/auth/login/2fa') ||
                    url.includes('/auth/refresh') ||
                    url.includes('/auth/verify') ||
                    url.includes('/auth/forgot-password') ||
                    url.includes('/auth/reset-password');

                if (error.status === 401 && isOurApi && !isAuthEndpoint) {
                    this.authService.logout();
                    this.toastService.showError('Sesión expirada. Por favor, ingresa de nuevo.');
                }
                return throwError(() => error);
            })
        );
    }
}
