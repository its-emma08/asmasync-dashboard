import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private socket: WebSocket | null = null;
    private messagesSubject = new Subject<any>();
    public messages$ = this.messagesSubject.asObservable();
    private reconnectInterval = 5000;

    constructor(private authService: AuthService) { }

    private isMockMode = false;

    connect(): void {
        // Kill Switch: Environment or Dynamic Failure
        // Check environment FIRST. If mock mode, do absolute nothing.
        if (environment.mockMode) {
            console.debug('WebSocketService: Aborted connect() due to Environment Mock Mode');
            return;
        }

        if (this.isMockMode) {
            console.debug('WebSocket disabled (Dynamic Mock Mode Active)');
            return;
        }

        const token = this.authService.getToken();
        if (!token) {
            return;
        }

        const wsUrl = `${environment.wsUrl}?token=${token}`;

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            // console.log('WebSocket conectado');
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.messagesSubject.next(data);
            } catch (e) {
                console.error('Error parsing WS message', e);
            }
        };

        this.socket.onerror = (error) => {
            console.warn('WebSocket connection failed. Switching to Mock Mode.');
            this.isMockMode = true; // Stop future attempts
        };

        this.socket.onclose = (event) => {
            if (this.isMockMode) {
                // console.log('WebSocket closed. Mock Mode active, not reconnecting.');
                return;
            }

            // console.log('WebSocket desconectado. Intentando reconectar...', event);
            if (!event.wasClean) {
                setTimeout(() => this.connect(), this.reconnectInterval);
            }
        };
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    send(message: any): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
        // Silent noop when not connected — no console noise
    }
}
