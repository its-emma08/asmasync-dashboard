import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { WebSocketService } from './core/services/websocket.service';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('AsmaSync Dashboard');
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private wsService: WebSocketService
  ) { }

  ngOnInit() {
    // Conectar WS si usuario autenticado
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        this.wsService.connect();
      } else {
        this.wsService.disconnect();
      }
    });

    // Mantener conexión viva
    this.startHeartbeat();
  }

  private startHeartbeat() {
    interval(30000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.wsService.send({ type: 'ping' });
    });
  }

  ngOnDestroy() {
    this.wsService.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
