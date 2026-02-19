import { Component, OnInit, OnDestroy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { WebSocketService } from './core/services/websocket.service';
import { SessionTimerService } from './core/services/session-timer.service';
import { StorageService } from './core/services/storage.service';
import { interval, Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { routeAnimations } from './shared/animations/route-animations';
import { LoadingScreenComponent } from './shared/components/loading-screen/loading-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, LoadingScreenComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  animations: [routeAnimations]
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('AsmaSync Dashboard');
  private destroy$ = new Subject<void>();

  isLoading = signal(true); // Start with loading state
  loadingProgress = signal(0); // Progress percentage

  constructor(
    private authService: AuthService,
    private wsService: WebSocketService,
    private router: Router,
    private sessionTimer: SessionTimerService,
    private storageService: StorageService,
    private cdRef: ChangeDetectorRef
  ) { }

  private cleanupLegacyData() {
    // Trigger migration of known keys
    ['asmasync_patients', 'asmasync_settings', 'asmasync_dashboard_layout'].forEach(key => {
      this.storageService.getItem(key);
    });
  }

  getRouteAnimationData(outlet: RouterOutlet) {
    // Robust check for animation data
    return outlet?.activatedRouteData?.['animation'];
  }

  ngOnInit() {
    // Start Session Watchdog
    this.sessionTimer.startMonitoring();
    this.cleanupLegacyData();

    // Splash Screen Logic (2.5 seconds)
    const totalTime = 2500;
    const intervalTime = 100;
    const steps = totalTime / intervalTime;
    let currentStep = 0;

    const loader = setInterval(() => {
      currentStep++;
      // Progress calculation kept for internal state if needed, though 3D loader handles its own visuals
      this.loadingProgress.set(Math.min(100, Math.round((currentStep / steps) * 100)));

      if (currentStep >= steps) {
        clearInterval(loader);

        // Defer state update to next macrotask to avoid NG0100
        // This ensures the view transition happens outside the current CD cycle
        setTimeout(() => {
          this.isLoading.set(false);
          // Auto-detection will handle the rest
        }, 0);
      }
    }, intervalTime);

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
