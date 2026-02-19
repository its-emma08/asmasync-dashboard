import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '@angular/common';

@Pipe({
    name: 'safeDate',
    standalone: true
})
export class SafeDatePipe implements PipeTransform {

    transform(value: any, format: string = 'mediumDate', locale: string = 'en-US'): string {
        if (!value) return '';

        // If it's already a relative-time string like "Hace 10 min", return as-is
        if (typeof value === 'string' && (value.includes('Hace') || value.includes('ago') || value.includes('hora'))) {
            return value;
        }

        // Try to parse as date
        try {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return String(value);
            }
            return formatDate(date, format, locale);
        } catch {
            return String(value);
        }
    }
}
