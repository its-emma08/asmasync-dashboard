import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'relativeTime',
    standalone: true
})
export class RelativeTimePipe implements PipeTransform {

    transform(value: string | Date | undefined): string {
        if (!value) return '';

        const date = new Date(value);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Hace unos segundos';

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min atrás`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} h atrás`;

        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} días atrás`;

        const months = Math.floor(days / 30);
        if (months < 12) return `${months} meses atrás`;

        return 'Hace mucho tiempo';
    }
}
