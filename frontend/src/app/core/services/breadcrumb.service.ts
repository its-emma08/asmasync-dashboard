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

            // Use routeConfig.data (not snapshot.data) to avoid inheriting parent breadcrumbs
            let label = child.snapshot.routeConfig?.data?.['breadcrumb'];
            if (!label && routeURL) {
                label = routeURL.charAt(0).toUpperCase() + routeURL.slice(1);
                if (label.match(/\d/)) label = 'Detalle';
            }

            if (label) {
                breadcrumbs.push({ label, url });
            }

            return this.createBreadcrumbs(child, url, breadcrumbs);
        }

        return breadcrumbs;
    }
}
