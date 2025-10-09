/**
 * Keyboard Shortcuts Help Modal
 * Shows all available keyboard shortcuts organized by category
 */

import React from 'react';
import { keyboardShortcuts, formatShortcut, KeyboardShortcut } from '../../utils/keyboardShortcuts';

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const shortcuts = keyboardShortcuts.getAll();
    const categories: Record<string, KeyboardShortcut[]> = {
        search: keyboardShortcuts.getByCategory('search'),
        actions: keyboardShortcuts.getByCategory('actions'),
        navigation: keyboardShortcuts.getByCategory('navigation'),
        help: keyboardShortcuts.getByCategory('help')
    };

    const categoryLabels = {
        search: '🔍 Search',
        actions: '⚡ Actions',
        navigation: '🧭 Navigation',
        help: '❓ Help'
    };

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4',
        onClick: onClose,
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'shortcuts-modal-title'
    },
        React.createElement('div', {
            className: 'bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col',
            onClick: (e: React.MouseEvent) => e.stopPropagation()
        }, [
            // Header
            React.createElement('div', {
                key: 'header',
                className: 'px-6 py-4 border-b border-gray-200 flex items-center justify-between'
            }, [
                React.createElement('h2', {
                    key: 'title',
                    id: 'shortcuts-modal-title',
                    className: 'text-xl font-bold text-gray-900'
                }, '⌨️ Keyboard Shortcuts'),
                React.createElement('button', {
                    key: 'close',
                    onClick: onClose,
                    className: 'text-gray-400 hover:text-gray-600 focus:outline-none text-2xl',
                    'aria-label': 'Close shortcuts help'
                }, '×')
            ]),

            // Content
            React.createElement('div', {
                key: 'content',
                className: 'px-6 py-4 overflow-y-auto flex-1'
            }, [
                React.createElement('p', {
                    key: 'intro',
                    className: 'text-sm text-gray-600 mb-6'
                }, 'Use these keyboard shortcuts to navigate quickly and boost your productivity.'),

                ...Object.entries(categories).map(([category, shortcuts]) => {
                    if (shortcuts.length === 0) return null;

                    return React.createElement('div', {
                        key: category,
                        className: 'mb-6 last:mb-0'
                    }, [
                        React.createElement('h3', {
                            key: 'category-title',
                            className: 'text-lg font-semibold text-gray-800 mb-3'
                        }, categoryLabels[category as keyof typeof categoryLabels]),

                        React.createElement('div', {
                            key: 'shortcuts-list',
                            className: 'space-y-2'
                        }, shortcuts.map((shortcut, index) => 
                            React.createElement('div', {
                                key: index,
                                className: 'flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                            }, [
                                React.createElement('span', {
                                    key: 'description',
                                    className: 'text-sm text-gray-700'
                                }, shortcut.description),

                                React.createElement('kbd', {
                                    key: 'shortcut',
                                    className: 'px-3 py-1 bg-white border border-gray-300 rounded shadow-sm text-sm font-mono font-semibold text-gray-800'
                                }, formatShortcut(shortcut))
                            ])
                        ))
                    ]);
                }).filter(Boolean)
            ]),

            // Footer
            React.createElement('div', {
                key: 'footer',
                className: 'px-6 py-4 border-t border-gray-200 bg-gray-50'
            }, React.createElement('div', {
                className: 'flex items-center gap-2 text-sm text-gray-600'
            }, [
                React.createElement('span', {
                    key: 'tip-icon',
                    className: 'text-lg'
                }, '💡'),
                React.createElement('span', {
                    key: 'tip-text'
                }, 'Tip: Press ? anytime to see this help again')
            ]))
        ])
    );
};

export default KeyboardShortcutsModal;

