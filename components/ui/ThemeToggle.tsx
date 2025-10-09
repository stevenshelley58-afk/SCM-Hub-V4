/**
 * Theme Toggle Button
 * Allows users to switch between light, dark, and auto themes
 */

import React, { useState, useEffect } from 'react';
import { themeManager, Theme } from '../../utils/themeManager';

export const ThemeToggle: React.FC = () => {
    const [theme, setTheme] = useState<Theme>(themeManager.getTheme());
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(themeManager.getResolvedTheme());

    useEffect(() => {
        const unsubscribe = themeManager.subscribe((newTheme) => {
            setResolvedTheme(newTheme);
        });

        return unsubscribe;
    }, []);

    const handleToggle = () => {
        themeManager.cycle();
        setTheme(themeManager.getTheme());
    };

    const getIcon = () => {
        switch (theme) {
            case 'light':
                return '☀️';
            case 'dark':
                return '🌙';
            case 'auto':
                return '🌓';
            default:
                return '☀️';
        }
    };

    const getLabel = () => {
        switch (theme) {
            case 'light':
                return 'Light mode';
            case 'dark':
                return 'Dark mode';
            case 'auto':
                return `Auto (${resolvedTheme})`;
            default:
                return 'Theme';
        }
    };

    return React.createElement('button', {
        onClick: handleToggle,
        className: 'flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
        'aria-label': `Switch theme. Currently: ${getLabel()}`,
        title: `Click to cycle theme. Current: ${getLabel()}`
    }, [
        React.createElement('span', {
            key: 'icon',
            className: 'text-xl',
            'aria-hidden': 'true'
        }, getIcon()),
        React.createElement('span', {
            key: 'label',
            className: 'text-sm font-medium text-gray-700 dark:text-gray-300'
        }, getLabel())
    ]);
};

export default ThemeToggle;

