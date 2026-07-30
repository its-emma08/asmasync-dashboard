import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-captcha',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './captcha.component.html'
})
export class CaptchaComponent {
    @Input() type: 'recaptcha' | 'hcaptcha' = 'recaptcha';
    @Output() resolved = new EventEmitter<boolean>();

    public status: 'unverified' | 'verifying' | 'verified' = 'unverified';

    verifyCaptcha() {
        if (this.status !== 'unverified') return;

        this.status = 'verifying';

        // Simular el tiempo de verificación de red
        setTimeout(() => {
            this.status = 'verified';
            this.resolved.emit(true);
        }, 1500);
    }
}
