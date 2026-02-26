import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';

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
    @Input() userName: string = 'Admin';
    @Input() alertCount: number = 0;
    @Output() menuToggle = new EventEmitter<void>();

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    onMenuToggle(): void {
        this.menuToggle.emit();
    }

    navigateToAlerts(): void {
        this.router.navigate(['/dashboard/alerts']);
    }

    navigateToProfile(): void {
        // Implement profile route when ready
        // console.log('Navigate to Profile');
    }

    navigateToSettings(): void {
        // Implement settings route when ready
        // console.log('Navigate to Settings');
    }

    logout(): void {
        this.authService.logout();
    }
}
