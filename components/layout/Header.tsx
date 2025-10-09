
import React from 'react';
import { ICONS } from '../ui/Icons';
import { PermissionBadge } from '../ui/PermissionBadge';
// Fix: Corrected import path for types.
import { User } from '../../types/index';

interface HeaderProps {
    title: string;
    user: User;
    currentView: string;
}

export const Header = ({ title, user, currentView }: HeaderProps) => {
    const isPickingView = currentView === 'picking';
    return React.createElement('header', { className: `h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 ${isPickingView ? 'hidden' : ''}` },
        React.createElement('h1', { className: "text-xl font-semibold text-gray-800" }, title),
        React.createElement('div', { className: "flex items-center space-x-4" },
            React.createElement(PermissionBadge, { user }),
            React.createElement('div', { className: "flex items-center space-x-3" },
                React.createElement(ICONS.UserCircleIcon, { className: "h-8 w-8 text-gray-600" }),
                React.createElement('div', { className: "text-sm text-left" },
                    React.createElement('div', { className: "font-medium text-gray-800" }, user.name),
                    React.createElement('div', { className: "text-gray-500" }, user.role)
                ),
                React.createElement(ICONS.ChevronDownIcon, { className: "h-5 w-5 text-gray-400" })
            )
        )
    );
};
