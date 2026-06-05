import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { SearchService } from '../../../../core/services/search.service';
import { LayoutService } from '../../../../core/services/layout.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { BreadcrumbService, Breadcrumb } from '../../../../core/services/breadcrumb.service';
import { Alert } from '../../../../core/models/alert.model';
import { ThemeService } from '../../../../core/services/theme.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatMenuModule, MatBadgeModule, MatDividerModule, FormsModule],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardHeaderComponent implements OnInit, OnDestroy {
  currentDate = new Date();
  searchTerm = '';
  private destroy$ = new Subject<void>();

  doctorName = 'Usuario';
  doctorSpecialty = 'Especialista';
  doctorInitials = 'US';

  unreadCount$: Observable<number>;
  notifications$: Observable<Alert[]>;
  breadcrumbs$: Observable<Breadcrumb[]>;

  constructor(
    private router: Router,
    private authService: AuthService,
    private searchService: SearchService,
    private layoutService: LayoutService,
    private notificationService: NotificationService,
    private breadcrumbService: BreadcrumbService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef
  ) {
    this.unreadCount$ = this.notificationService.unreadCount$;
    this.notifications$ = this.notificationService.notifications$;
    this.breadcrumbs$ = this.breadcrumbService.breadcrumbs$;
  }

  ngOnInit() {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      queueMicrotask(() => {
        if (user) {
          this.doctorName = user.full_name || 'Usuario';
          this.doctorInitials = this.getInitials(user.full_name);
          this.doctorSpecialty = 'Especialista';
        }
        this.cdr.markForCheck();
      });
    });
  }

  private getInitials(name: string): string {
    if (!name) return 'US';
    const parts = name.split(' ').filter(n => n.length > 0);
    if (parts.length === 0) return 'US';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  onSearch(term: string) {
    this.searchService.setSearchTerm(term);
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchService.setSearchTerm('');
  }

  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }

  handleNotificationClick(alert: Alert) {
    if (!alert) return;

    if (!alert.is_viewed) {
      this.notificationService.markAsRead(alert.id).subscribe();
    }

    // Professional routing based on alert context
    // If it's a patient alert, go to patient details (default for now)
    if (alert.patient_id) {
      this.router.navigate(['/dashboard/patients', alert.patient_id]);
    } else {
      // Fallback for general alerts
      this.router.navigate(['/dashboard/alerts']);
    }
  }

  markAllRead(event: Event) {
    event.stopPropagation();
    this.notifications$.pipe(take(1)).subscribe(alerts => {
      alerts.filter(a => !a.is_viewed).forEach(a => {
        this.notificationService.markAsRead(a.id).pipe(take(1)).subscribe();
      });
    });
  }

  goToProfile(): void {
    this.router.navigate(['/dashboard/profile']);
  }

  goToSettings(): void {
    this.router.navigate(['/dashboard/settings']);
  }

  goToHelp(): void {
    this.router.navigate(['/dashboard/help']);
  }

  logout(): void {
    this.authService.logout();
  }

  get isDarkMode(): boolean {
    return this.themeService.isDark();
  }

  toggleTheme() {
    this.themeService.setTheme(this.isDarkMode ? 'light' : 'dark');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
