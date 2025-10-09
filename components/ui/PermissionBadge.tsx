/**
 * Permission Badge Component
 * Shows user permissions and MC god mode indicator
 */

import React, { useState } from 'react';
import { User } from '../../types';
import { isMC, getUserPermissions, getGodModeDescription } from '../../utils/permissions';
import { ICONS } from './Icons';

interface PermissionBadgeProps {
    user: User;
}

export const PermissionBadge: React.FC<PermissionBadgeProps> = ({ user }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    if (!isMC(user)) {
        // Regular users don't need a permission badge
        return null;
    }

    return React.createElement('div', { className: 'relative inline-block' },
        React.createElement('div', {
            className: 'flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-lg cursor-help',
            onMouseEnter: () => setShowTooltip(true),
            onMouseLeave: () => setShowTooltip(false)
        },
            React.createElement(ICONS.ShieldCheckIcon, { className: 'h-4 w-4' }),
            React.createElement('span', null, 'GOD MODE')
        ),
        showTooltip && React.createElement('div', {
            className: 'absolute z-50 left-0 top-full mt-2 w-80 bg-gray-900 text-white text-xs rounded-lg shadow-2xl p-4',
            style: { whiteSpace: 'pre-line' }
        },
            React.createElement('div', { className: 'font-bold text-sm mb-2 text-purple-300' }, '🔓 Material Coordinator God Mode'),
            React.createElement('div', { className: 'space-y-1 text-gray-300' }, getGodModeDescription())
        )
    );
};

interface PermissionIndicatorProps {
    user: User;
    action: string;
    reason?: string;
}

/**
 * Shows a small indicator when an action is performed using MC god mode permissions
 */
export const PermissionIndicator: React.FC<PermissionIndicatorProps> = ({ user, action, reason }) => {
    if (!isMC(user)) return null;

    return React.createElement('div', {
        className: 'inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full'
    },
        React.createElement(ICONS.ShieldCheckIcon, { className: 'h-3 w-3' }),
        React.createElement('span', null, `MC Override: ${action}`),
        reason && React.createElement('span', { className: 'text-purple-600 ml-1' }, `(${reason})`)
    );
};

/**
 * Simple text version for status history
 */
export const getPermissionLabel = (user: User | null | undefined): string => {
    if (!user) return '';
    return isMC(user) ? '[MC God Mode]' : '';
};

