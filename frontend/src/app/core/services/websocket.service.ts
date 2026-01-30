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

    connect(): void {
        const token = this.authService.getToken();
        if (!token) {
            console.warn('No token available for WebSocket');
            return;
        }

        // Append token to URL (common practice for WS auth if headers not supported clearly in browser API)
        // Or send as first message. Using query param for this implementation.
        const wsUrl = `${environment.wsUrl}?token=${token}`;

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log('WebSocket conectado');
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
            console.error('Error en WebSocket:', error);
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket desconectado. Intentando reconectar...', event);
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
        } else {
            console.warn('WebSocket no conectado, no se pudo enviar mensaje');
        }
    }
}
