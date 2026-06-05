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
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  animations: [routeAnimations]
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('AsmaSync Dashboard');
  private destroy$ = new Subject<void>();

  isLoading = signal(true); // Start with loading state
  isFadingOut = signal(false); // Used for smooth exit transition
  loadingProgress = signal(0); // Progress percentage

  constructor(
    private authService: AuthService,
    private wsService: WebSocketService,
    private router: Router,
    private sessionTimer: SessionTimerService,
    private storageService: StorageService,
    private cdRef: ChangeDetectorRef,
    private themeService: ThemeService
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

        // Immediate transition - Let components handle their own skeletons
        this.isLoading.set(false);
        this.isFadingOut.set(true);

        // Conectar WS si usuario autenticado
        this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
            if (user) {
                this.wsService.connect();
                if (user.settings) {
                    this.storageService.setItem('asmasync_settings', user.settings);
                    this.themeService.applyThemeSettings(
                        user.settings.theme || 'light',
                        user.settings.accentColor,
                        !!user.settings.compactMode
                    );
                }
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
