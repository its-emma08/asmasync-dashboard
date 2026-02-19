import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatListModule,
        MatIconModule,
        MatBadgeModule,
        MatDividerModule
    ],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
    @Output() closeSidebar = new EventEmitter<void>();
    unreadAlerts$: Observable<number>;

    constructor(
        private alertService: AlertService,
        private authService: AuthService,
        private router: Router
    ) {
        this.unreadAlerts$ = this.alertService.unreadCount$;
    }

    onClose(): void {
        this.closeSidebar.emit();
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
