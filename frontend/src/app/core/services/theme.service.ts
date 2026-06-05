import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly THEME_KEY = 'asmasync_theme';
    private currentTheme: 'light' | 'dark' | 'system' = 'light';
    private mediaQuery: MediaQueryList | null = null;
    private mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        this.initTheme();
    }

    private initTheme() {
        if (isPlatformBrowser(this.platformId)) {
            // Check for full settings JSON first
            const savedSettingsStr = localStorage.getItem('asmasync_settings');
            let theme: 'light' | 'dark' | 'system' = 'light';
            let accentColor = '#3b82f6'; // default tailwind blue
            let compactMode = false;

            if (savedSettingsStr) {
                try {
                    const settings = JSON.parse(savedSettingsStr);
                    theme = settings.theme || 'light';
                    accentColor = settings.accentColor || '#3b82f6';
                    compactMode = !!settings.compactMode;
                } catch (e) {
                    theme = (localStorage.getItem(this.THEME_KEY) as 'light' | 'dark' | 'system') || 'light';
                }
            } else {
                theme = (localStorage.getItem(this.THEME_KEY) as 'light' | 'dark' | 'system') || 'light';
            }

            this.applyThemeSettings(theme, accentColor, compactMode);

            // Register system scheme listener
            this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.mediaListener = (e: MediaQueryListEvent) => {
                if (this.currentTheme === 'system') {
                    this.updateSystemTheme(e.matches);
                }
            };
            this.mediaQuery.addEventListener('change', this.mediaListener);
        }
    }

    applyThemeSettings(theme: 'light' | 'dark' | 'system', accentColor?: string, compactMode?: boolean) {
        this.currentTheme = theme;
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.THEME_KEY, theme);

            // 1. Dark class application
            const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            this.updateSystemTheme(isDark);

            // 2. Accent Color variables application
            if (accentColor) {
                document.documentElement.style.setProperty('--brand-primary', accentColor);
                
                const rgb = this.hexToRgb(accentColor);
                if (rgb) {
                    // Darken for hover (90% brightness)
                    const hoverColor = `rgb(${Math.max(0, Math.floor(rgb.r * 0.9))}, ${Math.max(0, Math.floor(rgb.g * 0.9))}, ${Math.max(0, Math.floor(rgb.b * 0.9))})`;
                    const lightColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`;
                    const borderLightColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
                    const sidebarAccentColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`;
                    const shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;

                    document.documentElement.style.setProperty('--brand-primary-hover', hoverColor);
                    document.documentElement.style.setProperty('--brand-primary-light', lightColor);
                    document.documentElement.style.setProperty('--brand-primary-border', borderLightColor);
                    document.documentElement.style.setProperty('--sidebar-accent', sidebarAccentColor);
                    document.documentElement.style.setProperty('--brand-primary-shadow', shadowColor);
                }
            }

            // 3. Compact mode class application
            if (compactMode) {
                document.body.classList.add('compact');
                document.documentElement.classList.add('compact');
            } else {
                document.body.classList.remove('compact');
                document.documentElement.classList.remove('compact');
            }
        }
    }

    setTheme(theme: 'light' | 'dark' | 'system') {
        if (isPlatformBrowser(this.platformId)) {
            const savedSettingsStr = localStorage.getItem('asmasync_settings');
            let accentColor = '#3b82f6';
            let compactMode = false;

            if (savedSettingsStr) {
                try {
                    const settings = JSON.parse(savedSettingsStr);
                    accentColor = settings.accentColor || '#3b82f6';
                    compactMode = !!settings.compactMode;
                } catch (e) {}
            }
            this.applyThemeSettings(theme, accentColor, compactMode);
        } else {
            this.currentTheme = theme;
        }
    }

    private updateSystemTheme(isDark: boolean) {
        if (isDark) {
            document.body.classList.add('dark');
            document.documentElement.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
            document.documentElement.classList.remove('dark');
        }
    }

    getTheme(): 'light' | 'dark' | 'system' {
        return this.currentTheme;
    }

    isDark(): boolean {
        if (!isPlatformBrowser(this.platformId)) return false;
        return this.currentTheme === 'dark' || (this.currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    private hexToRgb(hex: string) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}
