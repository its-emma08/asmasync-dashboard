import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface Breadcrumb {
    label: string;
    url: string;
}

@Injectable({
    providedIn: 'root'
})
export class BreadcrumbService {
    private _breadcrumbs$ = new BehaviorSubject<Breadcrumb[]>([]);
    breadcrumbs$ = this._breadcrumbs$.asObservable();

    constructor(private router: Router, private activatedRoute: ActivatedRoute) {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            const breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
            this._breadcrumbs$.next(breadcrumbs);
        });
    }

    private createBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
        const children: ActivatedRoute[] = route.children;

        if (children.length === 0) {
            return breadcrumbs;
        }

        for (const child of children) {
            const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
            if (routeURL !== '') {
                url += `/${routeURL}`;
            }

            // 1. Get breadcrumb label from data
            // 2. Fallback to path name, capitalized
            let label = child.snapshot.data['breadcrumb'];
            if (!label && routeURL) {
                // Dynamic ID fallback?
                // If it looks like an ID, maybe ignore or use "Detalle"?
                // For now, simple fallback
                label = routeURL.charAt(0).toUpperCase() + routeURL.slice(1);
                if (label.match(/\d/)) label = 'Detalle'; // Generic for IDs
            }

            if (label) {
                breadcrumbs.push({ label, url });
            }

            return this.createBreadcrumbs(child, url, breadcrumbs);
        }

        return breadcrumbs;
    }
}
