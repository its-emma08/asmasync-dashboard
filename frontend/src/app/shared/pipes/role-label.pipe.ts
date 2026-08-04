import { Pipe, PipeTransform } from '@angular/core';
import { roleLabel } from '../../core/models/role.model';

@Pipe({
    name: 'roleLabel',
    standalone: true
})
export class RoleLabelPipe implements PipeTransform {
    transform(role: unknown): string {
        return roleLabel(role);
    }
}