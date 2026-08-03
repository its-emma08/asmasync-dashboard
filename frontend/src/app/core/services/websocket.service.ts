import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export type ConnectionState = 'connected' | 'connecting' | 'disconnected';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private socket: WebSocket | null = null;
    private messagesSubject = new Subject<any>();
    public messages$ = this.messagesSubject.asObservable();

    private statusSubject = new BehaviorSubject<ConnectionState>('disconnected');
    public status$ = this.statusSubject.asObservable();

    private reconnectInterval = 5000;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 3;
    private isDisabled = false;

    constructor(private authService: AuthService) { }

    private isMockMode = false;

    connect(): void {
        if (environment.mockMode || this.isDisabled || this.isMockMode) {
            this.statusSubject.next('disconnected');
            return;
        }

        const token = this.authService.getToken();
        const userId = this.authService.currentUserValue?.id;
        if (!token || !userId) {
            this.statusSubject.next('disconnected');
            return;
        }

        this.statusSubject.next('connecting');
        const wsUrl = `${environment.wsUrl}/${userId}?token=${token}`;

        try {
            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => {
                this.reconnectAttempts = 0;
                this.statusSubject.next('connected');
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.messagesSubject.next(data);
                } catch (e) {
                    console.error('Error parsing WS message', e);
                }
            };

            this.socket.onerror = () => {
                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    this.statusSubject.next('disconnected');
                    return;
                }
                this.statusSubject.next('connecting');
            };

            this.socket.onclose = (event) => {
                if (!event.wasClean) {
                    this.reconnectAttempts += 1;
                    if (this.reconnectAttempts > this.maxReconnectAttempts) {
                        this.isDisabled = true;
                        this.statusSubject.next('disconnected');
                        return;
                    }
                    this.statusSubject.next('connecting');
                    setTimeout(() => this.connect(), this.reconnectInterval);
                } else {
                    this.statusSubject.next('disconnected');
                }
            };
        } catch (e) {
            this.statusSubject.next('disconnected');
        }
    }

    reconnect(): void {
        this.isDisabled = false;
        this.reconnectAttempts = 0;
        this.disconnect();
        this.connect();
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
