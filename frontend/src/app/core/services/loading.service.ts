import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LoadingService {
    private loadingState = new BehaviorSubject<{ message: string; progress: number }>({
        message: 'Iniciando AsmaSync...',
        progress: 0
    });

    loadingState$ = this.loadingState.asObservable();

    updateProgress(message: string, progress: number): void {
        this.loadingState.next({ message, progress });

        // Update DOM directly if loading element exists
        const loadingStatus = document.querySelector('.loading-status');
        const progressBar = document.querySelector('.progress-bar');

        if (loadingStatus) {
            loadingStatus.textContent = message;
        }

        if (progressBar) {
            (progressBar as HTMLElement).style.width = `${progress}%`;
        }
    }

    hideLoading(): void {
        const loadingScreen = document.querySelector('.app-loading');
        if (loadingScreen) {
            (loadingScreen as HTMLElement).style.opacity = '0';
            // Minimum display time (2.5s) to ensure branding visibility
            setTimeout(() => {
                (loadingScreen as HTMLElement).style.opacity = '0';
                setTimeout(() => {
                    (loadingScreen as HTMLElement).style.display = 'none';
                }, 500); // Fade out duration
            }, 2500);
        }
    }
}
