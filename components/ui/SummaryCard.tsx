import React from 'react';

interface SummaryCardProps {
    title: string;
    value?: string | number;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    onClick?: () => void;
    color?: 'blue' | 'amber' | 'red' | 'green' | 'gray';
}

export const SummaryCard = ({ title, value, icon, children, onClick, color = 'blue' }: SummaryCardProps) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        amber: 'bg-amber-100 text-amber-600',
        red: 'bg-red-100 text-red-600',
        green: 'bg-green-100 text-green-600',
        gray: 'bg-gray-100 text-gray-600',
    };
    const containerClass = `bg-white p-5 rounded-xl border border-gray-200 flex items-start justify-between ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''}`;
    
    return React.createElement('div', { className: containerClass, onClick: onClick },
        React.createElement('div', null,
            React.createElement('p', { className: "text-sm font-medium text-gray-500" }, title),
            value && React.createElement('p', { className: "text-2xl font-bold text-gray-800 mt-1" }, value),
            children
        ),
        icon && React.createElement('div', { className: `${colorClasses[color]} p-3 rounded-full` }, icon)
    );
};
