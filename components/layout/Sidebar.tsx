
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../ui/Icons';
import { users } from '../../services/api';
// Fix: Corrected import path for types.
import { User } from '../../types/index';

interface SidebarProps {
    currentUser: User;
    onUserChange: (user: User) => void;
    currentView: string;
    onNavigate: (view: string) => void;
    navLinks: { [key: string]: { view: string; label: string; icon: string }[] };
}

export const Sidebar = ({ currentUser, onUserChange, currentView, onNavigate, navLinks }: SidebarProps) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isPickingView = currentView === 'picking';
    if (isPickingView) return null;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const normalizedId = currentUser.id === 'requestor' ? 'requestor_mrf' : currentUser.id;
    const currentNavLinks = navLinks[normalizedId] || [];

    return React.createElement('aside', { className: "w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col" },
        React.createElement('div', { className: "h-16 flex items-center justify-center border-b border-gray-200" },
            React.createElement('div', { className: "flex items-center space-x-2" },
                React.createElement('div', { className: "bg-red-500 p-2 rounded-lg" },
                   React.createElement('svg', { className: "w-6 h-6 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h6m-6 4h6m-6 4h6" }))
                ),
                React.createElement('span', { className: "text-xl font-bold text-gray-800" }, 'Aufait UX')
            )
        ),
        React.createElement('nav', { className: "flex-1 p-4 space-y-2" },
            currentNavLinks.map(link => React.createElement('a', {
                href: '#', key: link.view,
                onClick: (e) => { e.preventDefault(); onNavigate(link.view); },
                className: `flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 ${currentView === link.view ? 'bg-blue-100 text-blue-700 font-semibold' : ''}`
            },
                React.createElement(ICONS[link.icon as keyof typeof ICONS], { className: "h-5 w-5 mr-3" }),
                link.label
            ))
        ),
        React.createElement('div', { ref: dropdownRef, className: "p-4 border-t border-gray-200 relative" },
            isDropdownOpen && React.createElement('div', { className: "transition-all absolute bottom-full mb-2 w-full left-0 bg-white border border-gray-200 rounded-lg shadow-xl" },
                 Object.values(users).map(user => React.createElement('a', {
                    href: "#", key: user.id,
                    onClick: (e) => { e.preventDefault(); onUserChange(user); setDropdownOpen(false); },
                    className: "block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                 }, `Sign in as ${user.role}`))
            ),
            React.createElement('button', { onClick: () => setDropdownOpen(!isDropdownOpen), className: "w-full text-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200" }, 'Switch User')
        )
    );
};
