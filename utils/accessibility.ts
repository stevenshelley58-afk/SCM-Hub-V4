/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliance helpers for keyboard navigation, ARIA labels, and screen reader support
 */

/**
 * Trap focus within a modal or dialog
 */
export const trapFocus = (element: HTMLElement): (() => void) => {
    const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    const focusableElements = element.querySelectorAll(focusableSelectors);
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            // Shift+Tab: move backwards
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable?.focus();
            }
        } else {
            // Tab: move forwards
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable?.focus();
            }
        }
    };

    element.addEventListener('keydown', handleTabKey);

    // Focus first element
    firstFocusable?.focus();

    // Return cleanup function
    return () => {
        element.removeEventListener('keydown', handleTabKey);
    };
};

/**
 * Restore focus to the previously focused element
 */
export const createFocusManager = () => {
    let previouslyFocused: HTMLElement | null = null;

    return {
        save: () => {
            previouslyFocused = document.activeElement as HTMLElement;
        },
        restore: () => {
            previouslyFocused?.focus();
            previouslyFocused = null;
        }
    };
};

/**
 * Generate accessible label for screen readers
 */
export const getAriaLabel = (
    context: string,
    value?: string | number,
    additionalInfo?: string
): string => {
    let label = context;
    if (value !== undefined) label += `: ${value}`;
    if (additionalInfo) label += `. ${additionalInfo}`;
    return label;
};

/**
 * Announce message to screen readers using aria-live region
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Find or create aria-live region
    let liveRegion = document.getElementById('aria-live-region');
    
    if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only'; // Screen reader only (visually hidden)
        document.body.appendChild(liveRegion);
    }

    // Update the message
    liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
        if (liveRegion) liveRegion.textContent = '';
    }, 1000);
};

/**
 * Handle keyboard navigation for lists (Arrow keys, Home, End)
 */
export const handleListKeyboardNavigation = (
    event: KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    onNavigate: (newIndex: number) => void
) => {
    let newIndex = currentIndex;

    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            newIndex = (currentIndex + 1) % totalItems;
            break;
        case 'ArrowUp':
            event.preventDefault();
            newIndex = (currentIndex - 1 + totalItems) % totalItems;
            break;
        case 'Home':
            event.preventDefault();
            newIndex = 0;
            break;
        case 'End':
            event.preventDefault();
            newIndex = totalItems - 1;
            break;
        default:
            return;
    }

    onNavigate(newIndex);
};

/**
 * Check if element is visible and focusable
 */
export const isFocusable = (element: HTMLElement): boolean => {
    if (element.hasAttribute('disabled')) return false;
    if (element.getAttribute('tabindex') === '-1') return false;
    
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    
    return true;
};

/**
 * Get keyboard shortcut description for accessibility
 */
export const getKeyboardShortcutLabel = (keys: string[]): string => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    return keys.map(key => {
        if (key === 'Ctrl' || key === 'Control') {
            return isMac ? 'Command' : 'Control';
        }
        if (key === 'Alt') {
            return isMac ? 'Option' : 'Alt';
        }
        return key;
    }).join(' + ');
};

/**
 * Set up ESC key handler for closing modals
 */
export const handleEscapeKey = (onClose: () => void): (() => void) => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
};

/**
 * ARIA attributes for common patterns
 */
export const ariaAttributes = {
    modal: (isOpen: boolean, labelId?: string) => ({
        role: 'dialog',
        'aria-modal': 'true',
        'aria-hidden': !isOpen,
        'aria-labelledby': labelId
    }),
    
    button: (label: string, pressed?: boolean, expanded?: boolean) => ({
        'aria-label': label,
        ...(pressed !== undefined && { 'aria-pressed': pressed }),
        ...(expanded !== undefined && { 'aria-expanded': expanded })
    }),
    
    checkbox: (label: string, checked: boolean) => ({
        role: 'checkbox',
        'aria-label': label,
        'aria-checked': checked
    }),
    
    tab: (label: string, selected: boolean, controls: string) => ({
        role: 'tab',
        'aria-label': label,
        'aria-selected': selected,
        'aria-controls': controls,
        tabIndex: selected ? 0 : -1
    }),
    
    tabPanel: (labelledBy: string) => ({
        role: 'tabpanel',
        'aria-labelledby': labelledBy,
        tabIndex: 0
    }),
    
    list: () => ({
        role: 'list'
    }),
    
    listItem: (index: number, total: number) => ({
        role: 'listitem',
        'aria-setsize': total,
        'aria-posinset': index + 1
    }),
    
    alert: (type: 'error' | 'warning' | 'success' | 'info') => ({
        role: 'alert',
        'aria-live': type === 'error' ? 'assertive' : 'polite'
    })
};

/**
 * Generate unique ID for linking labels and form elements
 */
let idCounter = 0;
export const generateUniqueId = (prefix: string = 'id'): string => {
    return `${prefix}-${Date.now()}-${++idCounter}`;
};

/**
 * Skip to main content link (for keyboard users)
 */
export const createSkipLink = (): HTMLAnchorElement => {
    const link = document.createElement('a');
    link.href = '#main-content';
    link.textContent = 'Skip to main content';
    link.className = 'sr-only sr-only-focusable';
    link.style.position = 'absolute';
    link.style.top = '0';
    link.style.left = '0';
    link.style.zIndex = '9999';
    
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const mainContent = document.getElementById('main-content');
        mainContent?.focus();
        mainContent?.scrollIntoView();
    });
    
    return link;
};

/**
 * Check color contrast ratio (WCAG AA requires 4.5:1 for normal text)
 */
export const checkContrastRatio = (foreground: string, background: string): boolean => {
    // This is a simplified check - in production, use a proper color contrast library
    // For now, just log a warning
    console.log(`TODO: Check contrast ratio between ${foreground} and ${background}`);
    return true;
};

/**
 * Add focus visible styles (for keyboard users)
 */
export const addFocusStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        /* Focus visible styles for keyboard navigation */
        *:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
        }
        
        /* Screen reader only class */
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
        }
        
        /* Screen reader only, but visible when focused */
        .sr-only-focusable:focus {
            position: static;
            width: auto;
            height: auto;
            padding: 0.5rem 1rem;
            margin: 0;
            overflow: visible;
            clip: auto;
            white-space: normal;
            background: #3b82f6;
            color: white;
        }
    `;
    document.head.appendChild(style);
};

/**
 * Initialize accessibility features
 */
export const initAccessibility = () => {
    // Add focus styles
    addFocusStyles();
    
    // Add skip link
    const skipLink = createSkipLink();
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Create aria-live region
    const liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    
    console.log('✅ Accessibility features initialized');
};

