import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { catchError, take, takeUntil, tap } from 'rxjs/operators';
import { Alert } from '../models/alert.model';
import { WebSocketService } from './websocket.service';

export interface ApiNotification {
  id: number;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  patient_id?: number;
  patient?: { id: number; full_name: string; risk_level: string };
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private http = inject(HttpClient);
  private swPush = inject(SwPush);
  private snackBar = inject(MatSnackBar);
  private wsService = inject(WebSocketService);

  private readonly BASE = `${environment.apiUrl}/notifications`;

  private notificationsSubject = new BehaviorSubject<Alert[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  public notificationsEnabled = signal(this.swPush.isEnabled);
  public subscription = signal<any>(null);

  constructor() {
    if (this.swPush.isEnabled) {
      this.swPush.subscription.subscribe(sub => this.subscription.set(sub));
    }
    this.setupWebSocketListener();
    this.wsService.connect();
    this.loadFromApi();
  }

  private loadFromApi(): void {
    this.http.get<ApiNotification[]>(this.BASE).pipe(
      take(1),
      catchError(() => of([] as ApiNotification[]))
    ).subscribe(items => {
      const alerts: Alert[] = items.map(n => this.toAlert(n));
      this.notificationsSubject.next(alerts);
      this.refreshUnreadCount();
    });
  }

  private refreshUnreadCount(): void {
    this.http.get<{ count: number }>(`${environment.apiUrl}/alerts/unread-count`).pipe(
      take(1),
      catchError(() => of({ count: this.notificationsSubject.value.filter(a => !a.is_viewed).length }))
    ).subscribe(res => this.unreadCountSubject.next(res.count));
  }

  private toAlert(n: ApiNotification): Alert {
    return {
      id: n.id,
      patient_id: n.patient_id ?? 0,
      alert_type: (n.type === 'critical' || n.type === 'danger') ? 'critical' : 'moderate',
      message: n.message,
      created_at: n.created_at,
      is_viewed: n.is_read,
      patient: n.patient ?? { id: n.patient_id ?? 0, full_name: 'Paciente', risk_level: 'yellow' }
    };
  }

  private setupWebSocketListener(): void {
    this.wsService.messages$.pipe(takeUntil(this.destroy$)).subscribe(msg => {
      if (msg.type === 'risk_update' || msg.type === 'new_symptom' || msg.type === 'pef_update') {
        this.handleIncomingAlert(msg);
      }
    });
  }

  private handleIncomingAlert(msg: any): void {
    const newAlert: Alert = {
      id: Date.now(),
      patient_id: msg.patientId,
      alert_type: msg.type === 'risk_update' && msg.risk === 'red' ? 'critical' : 'moderate',
      message: msg.message || `Nueva actualización clínica para el paciente ${msg.patientId}`,
      created_at: new Date().toISOString(),
      is_viewed: false,
      patient: { id: msg.patientId, full_name: msg.patientName || 'Paciente', risk_level: msg.risk || 'yellow' }
    };
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([newAlert, ...current]);
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    this.snackBar.open(`Nueva Alerta: ${newAlert.message}`, 'Ver', { duration: 5000 });
  }

  public markAsRead(id: number): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/alerts/${id}/mark-read`, {}).pipe(
      tap(() => {
        const updated = this.notificationsSubject.value.map(a =>
          a.id === id ? { ...a, is_viewed: true } : a
        );
        this.notificationsSubject.next(updated);
        const unread = updated.filter(a => !a.is_viewed).length;
        this.unreadCountSubject.next(unread);
      }),
      catchError(() => {
        // Optimistic update even on failure
        const updated = this.notificationsSubject.value.map(a =>
          a.id === id ? { ...a, is_viewed: true } : a
        );
        this.notificationsSubject.next(updated);
        return of({ success: true });
      })
    );
  }

  public async requestPermission(): Promise<void> {
    if (!this.swPush.isEnabled) return;
    const ref = this.snackBar.open(
      '¿Deseas recibir alertas críticas de AsmaSync?',
      'Activar',
      { duration: 10000, horizontalPosition: 'center', verticalPosition: 'top' }
    );
    ref.onAction().subscribe(async () => {
      try {
        const sub = await this.swPush.requestSubscription({ serverPublicKey: environment.vapidPublicKey || '' });
        this.subscription.set(sub);
        this.snackBar.open('¡Notificaciones activadas!', 'Cerrar', { duration: 3000 });
      } catch {
        this.snackBar.open('Error al activar notificaciones', 'Cerrar', { duration: 3000 });
      }
    });
  }

  public async sendLocalNotification(title: string, options: NotificationOptions): Promise<void> {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') new Notification(title, options);
    }
  }

  public triggerCriticalAlert(patientName: string): void {
    this.sendLocalNotification('🚨 ¡ALERTA CRÍTICA DE ASMA!', {
      body: `${patientName}, tus niveles están en zona de riesgo. Inicia el protocolo de emergencia ahora.`,
      icon: 'assets/icons/icon-192x192.png',
      badge: 'assets/icons/icon-72x72.png',
      tag: 'asthma-critical-alert',
      renotify: true,
      silent: false,
      data: { url: '/dashboard/emergency' }
    } as any);
  }

  public reload(): void {
    this.loadFromApi();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
