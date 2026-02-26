import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function noSqlInjectionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
            return null;
        }

        // SQL injection patterns: ' OR, --, ;, /*, xp_
        const sqlPattern = /(')|(--)|(;)|(\/\*)|(xp_)/i;
        // XSS patterns: <script, onerror=, javascript:, <iframe, onload=
        const xssPattern = /<script|onerror\s*=|javascript:|<iframe|onload\s*=|<img.*?on/i;

        const hasInjection = sqlPattern.test(control.value) || xssPattern.test(control.value);

        return hasInjection ? { sqlInjection: true } : null;
    };
}
