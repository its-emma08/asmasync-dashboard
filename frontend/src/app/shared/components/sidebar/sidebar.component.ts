import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatListModule,
        MatIconModule,
        MatBadgeModule,
        MatDividerModule,
        MatTooltipModule,
    ],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
    @Output() closeSidebar = new EventEmitter<void>();
    @Output() collapsedChange = new EventEmitter<boolean>();

    unreadAlerts$: Observable<number>;
    isCollapsed = false;

    _navItems = [
        { label: 'Tablero', icon: 'grid_view', route: '/dashboard', exact: true },
        { label: 'Alertas', icon: 'notifications', route: '/dashboard/alerts', badge: true },
        { label: 'Pacientes', icon: 'people', route: '/dashboard/patients' },
        { label: 'Reportes', icon: 'description', route: '/dashboard/reports', roles: ['admin', 'doctor'] },
        { label: 'Calendario', icon: 'calendar_month', route: '/dashboard/calendar' },
        { label: 'Hospital', icon: 'local_hospital', route: '/dashboard/hospital', roles: ['admin'] },
    ];

    get navItems() {
        const user = this.authService.currentUserValue;
        const role = user?.role || 'patient';
        return this._navItems.filter(item => !item.roles || item.roles.includes(role));
    }

    footerItems = [
        { label: 'Ayuda', icon: 'help_outline', route: '/dashboard/help' },
        { label: 'Configuración', icon: 'settings', route: '/dashboard/settings' },
    ];

    appVersion = '2.1.4-build.2026';

    constructor(
        private alertService: AlertService,
        private authService: AuthService,
        private router: Router
    ) {
        this.unreadAlerts$ = this.alertService.unreadCount$;
    }

    ngOnInit(): void {
        const saved = localStorage.getItem('sidebar_collapsed');
        this.isCollapsed = saved === 'true';
        this.collapsedChange.emit(this.isCollapsed);
    }

    toggleCollapse(): void {
        this.isCollapsed = !this.isCollapsed;
        localStorage.setItem('sidebar_collapsed', String(this.isCollapsed));
        this.collapsedChange.emit(this.isCollapsed);
    }

    onClose(): void {
        this.closeSidebar.emit();
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
