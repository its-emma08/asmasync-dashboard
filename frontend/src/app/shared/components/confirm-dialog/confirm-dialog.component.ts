import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
    template: `
        <div class="confirm-dialog-container p-6 text-center">
            <div class="icon-container mb-4 flex justify-center">
                <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center" 
                     [class.bg-red-50]="data.isDestructive">
                    <mat-icon [class.text-red-500]="data.isDestructive" class="text-slate-400 scale-125">
                        {{ data.isDestructive ? 'warning' : 'help' }}
                    </mat-icon>
                </div>
            </div>
            
            <h2 class="text-xl font-bold text-slate-800 mb-2">{{ data.title }}</h2>
            <p class="text-slate-500 mb-8 leading-relaxed">{{ data.message }}</p>
            
            <div class="flex gap-4">
                <button mat-stroked-button (click)="onCancel()" class="flex-1 !py-5 !rounded-xl !border-slate-200">
                    {{ data.cancelText || 'Cancelar' }}
                </button>
                <button mat-raised-button 
                        [color]="data.isDestructive ? 'warn' : 'primary'"
                        (click)="onConfirm()" 
                        class="flex-1 !py-5 !rounded-xl !shadow-none">
                    {{ data.confirmText || 'Confirmar' }}
                </button>
            </div>
        </div>
    `,
    styles: [`
        .confirm-dialog-container {
            font-family: 'Quicksand', sans-serif;
            max-width: 400px;
        }
    `]
})
export class ConfirmDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
    ) { }

    onConfirm(): void {
        this.dialogRef.close(true);
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
