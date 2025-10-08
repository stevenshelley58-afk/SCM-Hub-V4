import React from 'react';

export const ExceptionDashboardView = () => {
    return React.createElement('div', { className: 'p-8 border-4 border-dashed border-gray-200 rounded-lg bg-white h-full' },
        React.createElement('div', { className: 'text-center' },
            React.createElement('h1', { className: 'text-2xl font-bold text-gray-800' }, 'Exception Dashboard'),
            React.createElement('p', { className: 'mt-2 text-gray-500' }, 'This dashboard will display all material requests with exceptions, allowing for quick review and resolution.')
        )
    );
};
