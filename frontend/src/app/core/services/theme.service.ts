import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly THEME_KEY = 'asmasync_theme';
    private currentTheme: 'light' | 'dark' | 'system' = 'light';

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        this.initTheme();
    }

    private initTheme() {
        if (isPlatformBrowser(this.platformId)) {
            const savedTheme = localStorage.getItem(this.THEME_KEY) as 'light' | 'dark' | 'system' || 'light';
            this.setTheme(savedTheme);
        }
    }

    setTheme(theme: 'light' | 'dark' | 'system') {
        this.currentTheme = theme;
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.THEME_KEY, theme);

            const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

            if (isDark) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        }
    }

    getTheme(): 'light' | 'dark' | 'system' {
        return this.currentTheme;
    }

    isDark(): boolean {
        if (!isPlatformBrowser(this.platformId)) return false;
        return this.currentTheme === 'dark' || (this.currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
}
