import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../../services/dashboard.service';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-calendar-widget',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule, AsyncPipe],
    templateUrl: './calendar-widget.component.html',
    styleUrls: ['./calendar-widget.component.scss']
})
export class CalendarWidgetComponent {
    appointments$;

    constructor(private dashboardService: DashboardService) {
        this.appointments$ = this.dashboardService.appointments$;
    }
}
