import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

@Component({
    selector: 'app-dashboard-layout',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatSidenavModule,
        NavbarComponent,
        SidebarComponent
    ],
    templateUrl: './dashboard-layout.component.html',
    styleUrls: ['./dashboard-layout.component.scss']
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
    @ViewChild('sidenav') sidenav!: MatSidenav;

    isMobile = false;
    private breakpointSubscription: Subscription | undefined;

    constructor(private breakpointObserver: BreakpointObserver) { }

    ngOnInit(): void {
        // Detectar cambios en tamaño de pantalla
        this.breakpointSubscription = this.breakpointObserver
            .observe([Breakpoints.Handset])
            .subscribe(result => {
                this.isMobile = result.matches;
            });
    }

    toggleSidenav(): void {
        this.sidenav.toggle();
    }

    onSidebarClose(): void {
        if (this.isMobile) {
            this.sidenav.close();
        }
    }

    ngOnDestroy(): void {
        if (this.breakpointSubscription) {
            this.breakpointSubscription.unsubscribe();
        }
    }
}
