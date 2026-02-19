import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface SuccessModalData {
    title: string;
    message: string;
    buttonText?: string;
}

@Component({
    selector: 'app-success-modal',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule],
    templateUrl: './success-modal.component.html',
    styleUrls: ['./success-modal.component.scss']
})
export class SuccessModalComponent {
    constructor(
        public dialogRef: MatDialogRef<SuccessModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: SuccessModalData
    ) { }

    close(): void {
        this.dialogRef.close(true);
    }
}
