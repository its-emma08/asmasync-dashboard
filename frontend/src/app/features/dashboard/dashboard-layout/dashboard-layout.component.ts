import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription, Observable } from 'rxjs';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { DashboardHeaderComponent } from '../components/dashboard-header/dashboard-header.component';
import { LayoutService } from '../../../core/services/layout.service';

@Component({
    selector: 'app-dashboard-layout',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        SidebarComponent,
        DashboardHeaderComponent
    ],
    templateUrl: './dashboard-layout.component.html',
    styleUrls: ['./dashboard-layout.component.scss']
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {

    isMobile = false;
    sidebarOpen$: Observable<boolean>;
    private breakpointSubscription: Subscription | undefined;

    constructor(
        private breakpointObserver: BreakpointObserver,
        private cdRef: ChangeDetectorRef,
        private layoutService: LayoutService
    ) {
        this.sidebarOpen$ = this.layoutService.sidebarOpen$;
    }

    ngOnInit(): void {
        // Detect screen size changes
        this.breakpointSubscription = this.breakpointObserver
            .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
            .subscribe(result => {
                this.isMobile = result.matches;
                if (!this.isMobile) {
                    this.layoutService.closeSidebar(); // Reset when going to desktop
                }
                this.cdRef.detectChanges();
            });
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
