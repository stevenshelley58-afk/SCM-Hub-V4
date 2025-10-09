/**
 * Keyboard Shortcuts System
 * Global keyboard shortcuts for power users
 */

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean; // Command key on Mac
    description: string;
    action: () => void;
    category: 'navigation' | 'actions' | 'search' | 'help';
}

type ShortcutHandler = (event: KeyboardEvent) => void;

class KeyboardShortcutManager {
    private shortcuts: Map<string, KeyboardShortcut> = new Map();
    private handler: ShortcutHandler | null = null;
    private disabled: boolean = false;

    /**
     * Register a keyboard shortcut
     */
    register(shortcut: KeyboardShortcut): void {
        const key = this.generateKey(shortcut);
        this.shortcuts.set(key, shortcut);
    }

    /**
     * Unregister a keyboard shortcut
     */
    unregister(key: string, modifiers?: {
        ctrl?: boolean;
        alt?: boolean;
        shift?: boolean;
        meta?: boolean;
    }): void {
        const shortcutKey = this.generateKeyFromParams(key, modifiers);
        this.shortcuts.delete(shortcutKey);
    }

    /**
     * Generate a unique key for a shortcut
     */
    private generateKey(shortcut: KeyboardShortcut): string {
        return this.generateKeyFromParams(shortcut.key, {
            ctrl: shortcut.ctrl,
            alt: shortcut.alt,
            shift: shortcut.shift,
            meta: shortcut.meta
        });
    }

    private generateKeyFromParams(key: string, modifiers?: {
        ctrl?: boolean;
        alt?: boolean;
        shift?: boolean;
        meta?: boolean;
    }): string {
        const parts: string[] = [];
        if (modifiers?.ctrl) parts.push('ctrl');
        if (modifiers?.alt) parts.push('alt');
        if (modifiers?.shift) parts.push('shift');
        if (modifiers?.meta) parts.push('meta');
        parts.push(key.toLowerCase());
        return parts.join('+');
    }

    /**
     * Check if keyboard event matches a shortcut
     */
    private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
        const key = event.key.toLowerCase();
        if (key !== shortcut.key.toLowerCase()) return false;

        if (shortcut.ctrl && !event.ctrlKey && !event.metaKey) return false;
        if (!shortcut.ctrl && (event.ctrlKey || event.metaKey)) return false;

        if (shortcut.alt && !event.altKey) return false;
        if (!shortcut.alt && event.altKey) return false;

        if (shortcut.shift && !event.shiftKey) return false;
        if (!shortcut.shift && event.shiftKey) return false;

        return true;
    }

    /**
     * Initialize keyboard shortcut listener
     */
    init(): void {
        if (this.handler) return; // Already initialized

        this.handler = (event: KeyboardEvent) => {
            if (this.disabled) return;

            // Don't trigger shortcuts when typing in inputs
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                // Exception: Allow Ctrl+K and ? even in inputs if they're not typing
                const allowedKeys = ['k', '?'];
                if (!allowedKeys.includes(event.key.toLowerCase())) {
                    return;
                }
                if (event.key.toLowerCase() === 'k' && !event.ctrlKey && !event.metaKey) {
                    return;
                }
            }

            // Find matching shortcut
            for (const shortcut of this.shortcuts.values()) {
                if (this.matchesShortcut(event, shortcut)) {
                    event.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        };

        document.addEventListener('keydown', this.handler);
        console.log('✅ Keyboard shortcuts initialized');
    }

    /**
     * Cleanup keyboard shortcut listener
     */
    cleanup(): void {
        if (this.handler) {
            document.removeEventListener('keydown', this.handler);
            this.handler = null;
        }
    }

    /**
     * Temporarily disable all shortcuts
     */
    disable(): void {
        this.disabled = true;
    }

    /**
     * Re-enable shortcuts
     */
    enable(): void {
        this.disabled = false;
    }

    /**
     * Get all registered shortcuts
     */
    getAll(): KeyboardShortcut[] {
        return Array.from(this.shortcuts.values());
    }

    /**
     * Get shortcuts by category
     */
    getByCategory(category: KeyboardShortcut['category']): KeyboardShortcut[] {
        return this.getAll().filter(s => s.category === category);
    }
}

// Singleton instance
export const keyboardShortcuts = new KeyboardShortcutManager();

/**
 * Format shortcut for display
 */
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const parts: string[] = [];

    if (shortcut.ctrl) {
        parts.push(isMac ? '⌘' : 'Ctrl');
    }
    if (shortcut.alt) {
        parts.push(isMac ? '⌥' : 'Alt');
    }
    if (shortcut.shift) {
        parts.push(isMac ? '⇧' : 'Shift');
    }
    if (shortcut.meta) {
        parts.push('⌘');
    }

    parts.push(shortcut.key.toUpperCase());

    return parts.join(isMac ? '' : '+');
};

/**
 * Initialize default application shortcuts
 */
export const initDefaultShortcuts = (callbacks: {
    onQuickSearch?: () => void;
    onNewRequest?: () => void;
    onShowHelp?: () => void;
}) => {
    // Ctrl+K: Quick search
    if (callbacks.onQuickSearch) {
        keyboardShortcuts.register({
            key: 'k',
            ctrl: true,
            description: 'Open quick search',
            category: 'search',
            action: callbacks.onQuickSearch
        });
    }

    // Ctrl+N: New request
    if (callbacks.onNewRequest) {
        keyboardShortcuts.register({
            key: 'n',
            ctrl: true,
            description: 'Create new request',
            category: 'actions',
            action: callbacks.onNewRequest
        });
    }

    // ?: Show keyboard shortcuts help
    if (callbacks.onShowHelp) {
        keyboardShortcuts.register({
            key: '?',
            shift: true,
            description: 'Show keyboard shortcuts',
            category: 'help',
            action: callbacks.onShowHelp
        });
    }

    // ESC is handled in accessibility.ts for modals

    keyboardShortcuts.init();
};

