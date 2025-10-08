
import React, { useState } from 'react';
import { ICONS } from './Icons';
// Fix: Corrected import path for types.
import { WOMaterial } from '../../types/index';

interface RequestTrayProps {
    selectedCount: number;
    onReview: () => void;
    selectedItems: WOMaterial[];
}

export const RequestTray = ({ selectedCount, onReview, selectedItems }: RequestTrayProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (selectedCount === 0) return null;

    const selectedJdes = selectedItems
        .slice(0, 10) // Limit for display
        .map(item => ({ pKey: item.pKey, jde: item.jdeItemNo, desc: item.materialDescription }));

    return React.createElement('div', { className: "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl z-30 px-4" },
        React.createElement('div', { className: "bg-gray-800 text-white rounded-t-lg shadow-2xl flex flex-col" },
            React.createElement('div', { className: "p-4 flex items-center justify-between" },
                React.createElement('div', { className: "flex items-center" },
                     React.createElement('p', { className: "font-bold text-lg" }, `${selectedCount} Line${selectedCount > 1 ? 's' : ''} Selected`),
                     React.createElement('button', { onClick: () => setIsExpanded(!isExpanded), className: "text-gray-400 hover:text-white ml-3 p-1 rounded-full hover:bg-gray-700", 'aria-label': 'Toggle selection summary' },
                        React.createElement(isExpanded ? ICONS.ChevronDownIcon : ICONS.ChevronUpIcon, {})
                    )
                ),
                React.createElement('button', { onClick: onReview, className: "px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white text-sm" }, "Review & Add Details →")
            ),
            isExpanded && React.createElement('div', { className: "bg-gray-700 p-4 border-t border-gray-600 max-h-40 overflow-y-auto" },
                React.createElement('p', { className: "text-xs text-gray-300 font-semibold mb-2" }, "QUICK SUMMARY:"),
                React.createElement('ul', { className: "space-y-1 text-gray-400 text-xs font-mono" },
                    selectedJdes.map(item => React.createElement('li', { key: item.pKey, className: 'truncate' }, `${item.jde} - ${item.desc}`)),
                    selectedCount > 10 && React.createElement('li', {}, `...and ${selectedCount - 10} more`)
                )
            )
        )
    );
};
