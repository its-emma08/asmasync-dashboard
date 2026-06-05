import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, Observable } from 'rxjs';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { DashboardHeaderComponent } from '../components/dashboard-header/dashboard-header.component';
import { LayoutService } from '../../../core/services/layout.service';
import { ConnectivityService } from '../../../core/services/connectivity.service';

@Component({
    selector: 'app-dashboard-layout',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        SidebarComponent,
        DashboardHeaderComponent
    ],
    templateUrl: './dashboard-layout.component.html',
    styleUrls: ['./dashboard-layout.component.scss']
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {

    isMobile = false;
    sidebarOpen$: Observable<boolean>;
    isOnline$: Observable<boolean>;
    sidebarCollapsed = false;
    private breakpointSubscription: Subscription | undefined;

    constructor(
        private breakpointObserver: BreakpointObserver,
        private cdRef: ChangeDetectorRef,
        private layoutService: LayoutService,
        private connectivityService: ConnectivityService
    ) {
        this.sidebarOpen$ = this.layoutService.sidebarOpen$;
        this.isOnline$ = this.connectivityService.isOnline$;
        // Read initial collapse state from localStorage
        this.sidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    }

    ngOnInit(): void {
        this.breakpointSubscription = this.breakpointObserver
            .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
            .subscribe(result => {
                this.isMobile = result.matches;
                if (!this.isMobile) {
                    this.layoutService.closeSidebar();
                }
                this.cdRef.detectChanges();
            });
    }

    onSidebarCollapsedChange(collapsed: boolean): void {
        this.sidebarCollapsed = collapsed;
        this.cdRef.detectChanges();
    }

    closeSidebar(): void {
        this.layoutService.closeSidebar();
    }

    ngOnDestroy(): void {
        if (this.breakpointSubscription) {
            this.breakpointSubscription.unsubscribe();
        }
    }
}
