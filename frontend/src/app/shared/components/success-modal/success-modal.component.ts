import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface SuccessModalData {
    title: string;
    message: string;
    buttonText?: string;
    credentials?: { email: string; temp_password: string; note?: string } | null;
}

@Component({
    selector: 'app-success-modal',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
    templateUrl: './success-modal.component.html',
    styleUrls: ['./success-modal.component.scss']
})
export class SuccessModalComponent {
    copied = false;

    constructor(
        public dialogRef: MatDialogRef<SuccessModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: SuccessModalData
    ) { }

    close(): void {
        this.dialogRef.close(true);
    }

    copyCredentials(): void {
        if (!this.data.credentials) return;
        const text = `Email: ${this.data.credentials.email}\nContraseña: ${this.data.credentials.temp_password}`;
        navigator.clipboard.writeText(text).then(() => {
            this.copied = true;
            setTimeout(() => this.copied = false, 2500);
        });
    }
}
