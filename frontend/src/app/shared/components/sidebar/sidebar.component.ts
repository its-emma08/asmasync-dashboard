import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AlertService } from '../../../core/services/alert.service';
import { Observable } from 'rxjs';

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

    constructor(private alertService: AlertService) {
        this.unreadAlerts$ = this.alertService.unreadCount$;
    }

    onClose(): void {
        // Emitimos evento para que el padre sepa que queremos cerrar (útil en mobile)
        this.closeSidebar.emit();
    }
}
