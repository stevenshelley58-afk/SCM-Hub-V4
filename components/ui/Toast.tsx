
import React, { useEffect } from 'react';
import { ICONS } from './Icons';

interface ToastProps {
    message: string;
    onClose: () => void;
    type?: 'success' | 'error';
}

export const Toast = ({ message, onClose, type = 'success' }: ToastProps) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);
    
    const styles = {
        success: {
            borderColor: 'border-green-500',
            icon: '✅',
        },
        error: {
            borderColor: 'border-red-500',
            icon: '🔥',
        }
    };
    
    const config = styles[type];

    return React.createElement('div', { className: "fixed top-6 right-6 z-50" },
        React.createElement('div', { className: `bg-white border-l-4 ${config.borderColor} rounded-lg shadow-lg p-4 flex items-center` },
             React.createElement('span', { className: "text-2xl mr-3" }, config.icon),
            React.createElement('p', { className: "text-gray-700" }, message),
            React.createElement('button', { onClick: onClose, className: "ml-4 text-gray-400 hover:text-gray-600" }, 
                React.createElement(ICONS.XMarkIcon, { className: "h-5 w-5" })
            )
        )
    );
};
