import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { Observable } from 'rxjs';
import { User } from '../../../core/services/auth.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [
        CommonModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatBadgeModule,
        MatDividerModule
    ],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
    @Output() toggleSidebar = new EventEmitter<void>();

    unreadAlerts$: Observable<number>;
    currentUser$: Observable<User | null>;

    constructor(
        private alertService: AlertService,
        private authService: AuthService,
        private router: Router
    ) {
        this.unreadAlerts$ = this.alertService.unreadCount$;
        this.currentUser$ = this.authService.currentUser$;
    }

    onLogout(): void {
        this.authService.logout();
    }

    onToggleSidebar(): void {
        this.toggleSidebar.emit();
    }

    goToAlerts(): void {
        this.router.navigate(['/dashboard/alerts']);
    }

    markAllAsRead(): void {
        // En un caso real, llamaríamos al servicio para marcar todas
        this.alertService.updateUnreadCount(0);
    }
}
