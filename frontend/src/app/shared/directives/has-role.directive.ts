import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { RoleType, normalizeRole } from '../../core/models/role.model';

/**
 * Directiva estructural de acceso por rol.
 * Uso: <button *appHasRole="['admin']">...</button>
 * Si el rol del usuario NO está en la lista, el elemento se elimina del DOM.
 */
@Directive({
    selector: '[appHasRole]',
    standalone: true
})
export class HasRoleDirective implements OnDestroy {
    private appHasRoleRoles: RoleType[] = [];
    private userSub?: Subscription;
    private hasView = false;

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private authService: AuthService
    ) {
        this.userSub = this.authService.currentUser$.subscribe(user => {
            const allowed = user ? this.appHasRoleRoles.includes(normalizeRole(user.role)) : false;
            if (allowed && !this.hasView) {
                this.viewContainer.createEmbeddedView(this.templateRef);
                this.hasView = true;
            } else if (!allowed && this.hasView) {
                this.viewContainer.clear();
                this.hasView = false;
            }
        });
    }

    @Input()
    set appHasRole(roles: RoleType[] | string[]) {
        this.appHasRoleRoles = (roles || []).map(role => normalizeRole(role));
        // Re-evaluar inmediatamente si el usuario ya está cargado
        const current = this.authService.currentUserValue;
        if (current) {
            const allowed = this.appHasRoleRoles.includes(normalizeRole(current.role));
            if (allowed && !this.hasView) {
                this.viewContainer.createEmbeddedView(this.templateRef);
                this.hasView = true;
            } else if (!allowed && this.hasView) {
                this.viewContainer.clear();
                this.hasView = false;
            }
        }
    }

    ngOnDestroy(): void {
        this.userSub?.unsubscribe();
    }
}
