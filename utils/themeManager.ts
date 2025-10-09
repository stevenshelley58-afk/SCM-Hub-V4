/**
 * Theme Manager
 * Handles dark/light mode switching with OS preference detection and localStorage persistence
 */

export type Theme = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'scm-hub-theme';
const THEME_CLASS = 'dark';

class ThemeManager {
    private currentTheme: Theme = 'auto';
    private mediaQuery: MediaQueryList;
    private listeners: Set<(theme: 'light' | 'dark') => void> = new Set();

    constructor() {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.init();
    }

    /**
     * Initialize theme from localStorage or OS preference
     */
    private init(): void {
        // Check localStorage first
        const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
        
        if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
            this.currentTheme = savedTheme;
        } else {
            this.currentTheme = 'auto';
        }

        // Apply initial theme
        this.applyTheme();

        // Listen for OS theme changes when in auto mode
        this.mediaQuery.addEventListener('change', () => {
            if (this.currentTheme === 'auto') {
                this.applyTheme();
            }
        });

        console.log(`✅ Theme initialized: ${this.currentTheme} (resolved: ${this.getResolvedTheme()})`);
    }

    /**
     * Get the current theme setting
     */
    getTheme(): Theme {
        return this.currentTheme;
    }

    /**
     * Get the resolved theme (light or dark)
     */
    getResolvedTheme(): 'light' | 'dark' {
        if (this.currentTheme === 'auto') {
            return this.mediaQuery.matches ? 'dark' : 'light';
        }
        return this.currentTheme;
    }

    /**
     * Set the theme
     */
    setTheme(theme: Theme): void {
        this.currentTheme = theme;
        localStorage.setItem(STORAGE_KEY, theme);
        this.applyTheme();
        console.log(`Theme changed to: ${theme} (resolved: ${this.getResolvedTheme()})`);
    }

    /**
     * Toggle between light and dark
     */
    toggle(): void {
        const resolved = this.getResolvedTheme();
        this.setTheme(resolved === 'light' ? 'dark' : 'light');
    }

    /**
     * Cycle through themes: light → dark → auto
     */
    cycle(): void {
        const themes: Theme[] = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    /**
     * Apply the theme to the document
     */
    private applyTheme(): void {
        const resolved = this.getResolvedTheme();
        
        if (resolved === 'dark') {
            document.documentElement.classList.add(THEME_CLASS);
        } else {
            document.documentElement.classList.remove(THEME_CLASS);
        }

        // Notify listeners
        this.listeners.forEach(listener => listener(resolved));

        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(resolved);
    }

    /**
     * Update meta theme-color tag
     */
    private updateMetaThemeColor(theme: 'light' | 'dark'): void {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.setAttribute('name', 'theme-color');
            document.head.appendChild(metaThemeColor);
        }

        // Set color based on theme
        const color = theme === 'dark' ? '#1f2937' : '#ffffff';
        metaThemeColor.setAttribute('content', color);
    }

    /**
     * Subscribe to theme changes
     */
    subscribe(listener: (theme: 'light' | 'dark') => void): () => void {
        this.listeners.add(listener);
        
        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Check if dark mode is active
     */
    isDark(): boolean {
        return this.getResolvedTheme() === 'dark';
    }

    /**
     * Check if light mode is active
     */
    isLight(): boolean {
        return this.getResolvedTheme() === 'light';
    }
}

// Singleton instance
export const themeManager = new ThemeManager();

/**
 * React hook for theme management
 */
export const useTheme = () => {
    const [theme, setTheme] = React.useState<Theme>(themeManager.getTheme());
    const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>(themeManager.getResolvedTheme());

    React.useEffect(() => {
        const unsubscribe = themeManager.subscribe((newTheme) => {
            setResolvedTheme(newTheme);
        });

        return unsubscribe;
    }, []);

    const changeTheme = React.useCallback((newTheme: Theme) => {
        themeManager.setTheme(newTheme);
        setTheme(newTheme);
    }, []);

    return {
        theme,
        resolvedTheme,
        setTheme: changeTheme,
        toggle: () => {
            themeManager.toggle();
            setTheme(themeManager.getTheme());
        },
        cycle: () => {
            themeManager.cycle();
            setTheme(themeManager.getTheme());
        },
        isDark: resolvedTheme === 'dark',
        isLight: resolvedTheme === 'light'
    };
};

// Import React for the hook
import React from 'react';

