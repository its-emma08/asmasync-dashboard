import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface AppleToastData {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

@Component({
    selector: 'app-apple-toast',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    template: `
        <div class="apple-glass-container animate-spring-up" [class]="data.type">
            <div class="indicator-dot"></div>
            <span class="message-text">{{ data.message }}</span>
            <div class="divider"></div>
            <button class="dismiss-btn" (click)="snackBarRef.dismissWithAction()">Entendido</button>
        </div>
    `,
    styles: [`
        @keyframes springUp {
            0% { transform: translateY(100%) scale(0.9); opacity: 0; }
            70% { transform: translateY(-8px) scale(1.01); opacity: 1; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        .animate-spring-up {
            animation: springUp 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .apple-glass-container {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 16px 8px 12px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.6) !important;
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
            border: 0.5px solid rgba(255, 255, 255, 1) !important;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
            margin-bottom: 32px;
            max-width: fit-content;
            pointer-events: auto; /* Re-enable for the button */
        }

        .indicator-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            flex-shrink: 0;
            box-shadow: 0 0 8px currentColor;
        }

        .message-text {
            color: #1e293b;
            font-size: 0.8125rem;
            font-weight: 500;
            letter-spacing: -0.01em;
            white-space: nowrap;
        }

        .divider {
            width: 1px;
            height: 14px;
            background: rgba(30, 41, 59, 0.1);
            margin: 0 4px;
        }

        .dismiss-btn {
            background: none;
            border: none;
            color: #2563eb;
            font-size: 0.8125rem;
            font-weight: 700;
            cursor: pointer;
            padding: 4px 8px;
            transition: opacity 0.2s ease;
            
            &:hover {
                opacity: 0.7;
            }
        }

        /* Type Variations */
        .success .indicator-dot { background-color: #10b981; color: #10b981; }
        .error .indicator-dot { background-color: #ef4444; color: #ef4444; }
        .info .indicator-dot { background-color: #3b82f6; color: #3b82f6; }
        .warning .indicator-dot { background-color: #f59e0b; color: #f59e0b; }
    `]
})
export class AppleToastComponent {
    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: AppleToastData,
        public snackBarRef: MatSnackBarRef<AppleToastComponent>
    ) {}
}
