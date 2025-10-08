import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', delay = 200 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [showTimeout, setShowTimeout] = useState<NodeJS.Timeout | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        const timeout = setTimeout(() => {
            setIsVisible(true);
        }, delay);
        setShowTimeout(timeout);
    };

    const handleMouseLeave = () => {
        if (showTimeout) {
            clearTimeout(showTimeout);
            setShowTimeout(null);
        }
        setIsVisible(false);
    };

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
        left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
        right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900'
    };

    return React.createElement('div', {
        className: 'relative inline-flex',
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave
    },
        children,
        isVisible && React.createElement('div', {
            ref: tooltipRef,
            className: `absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]}`,
            style: { pointerEvents: 'none' }
        },
            content,
            React.createElement('div', {
                className: `absolute w-0 h-0 border-4 ${arrowClasses[position]}`
            })
        )
    );
};

// Helper component for info icon with tooltip
export const InfoTooltip: React.FC<{ content: string }> = ({ content }) => {
    return React.createElement(Tooltip, { content, position: 'top' },
        React.createElement('span', {
            className: 'inline-flex items-center justify-center w-4 h-4 ml-1 text-xs text-gray-500 border border-gray-400 rounded-full cursor-help hover:bg-gray-100'
        }, 'i')
    );
};

