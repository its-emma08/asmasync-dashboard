import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {}


    showLoading(message: string = 'Cargando datos...'): void {
        if (!isPlatformBrowser(this.platformId)) return;
        const loadingScreen = document.querySelector('.app-loading');
        if (loadingScreen) {
            (loadingScreen as HTMLElement).style.display = 'flex';
            (loadingScreen as HTMLElement).style.opacity = '1';
        }
        this.updateProgress(message, 50);
    }

    updateProgress(message: string, progress: number): void {
        this.loadingState.next({ message, progress });

        if (!isPlatformBrowser(this.platformId)) return;

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
        if (!isPlatformBrowser(this.platformId)) return;
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
