import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function noSqlInjectionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
            return null;
        }

        // Dangerous patterns: ' OR, --, ;, /*, xp_
        const sqlPattern = /(')|(--)|(;)|(\/\*)|(xp_)/i;
        const hasInjection = sqlPattern.test(control.value);

        return hasInjection ? { sqlInjection: true } : null;
    };
}
