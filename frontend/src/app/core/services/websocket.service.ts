import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
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
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 3;
    private isDisabled = false;

    constructor(private authService: AuthService) { }

    private isMockMode = false;

    connect(): void {
        // Kill Switch: Environment or Dynamic Failure
        // Check environment FIRST. If mock mode, do absolute nothing.
        if (environment.mockMode) {
            console.debug('WebSocketService: Aborted connect() due to Environment Mock Mode');
            return;
        }

        if (this.isDisabled) {
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

        const userId = this.authService.currentUserValue?.id;
        if (!userId) {
            return;
        }

        const wsUrl = `${environment.wsUrl}/${userId}?token=${token}`;

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            this.reconnectAttempts = 0;
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.messagesSubject.next(data);
            } catch (e) {
                console.error('Error parsing WS message', e);
            }
        };

        this.socket.onerror = (_error) => {
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                return;
            }
            console.debug('WebSocket connection failed. Retry incoming...');
        };

        this.socket.onclose = (event) => {

            // console.log('WebSocket desconectado. Intentando reconectar...', event);
            if (!event.wasClean) {
                this.reconnectAttempts += 1;
                if (this.reconnectAttempts > this.maxReconnectAttempts) {
                    this.isDisabled = true;
                    return;
                }
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
