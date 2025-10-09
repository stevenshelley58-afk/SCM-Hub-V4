
import React from 'react';
import { ICONS } from './Icons';
// Fix: Corrected import path for types.
import { LockInfo } from '../../types/index';

interface StatusPillProps {
    status: string;
    lockInfo?: LockInfo;
}

export const StatusPill = ({ status, lockInfo }: StatusPillProps) => {
    const styles: { [key: string]: string } = {
        'Delivered': 'bg-green-100 text-green-800',
        'In Transit': 'bg-blue-100 text-blue-800',
        'Exception': 'bg-red-100 text-red-800',
        'Partial Pick - Open': 'bg-orange-100 text-orange-800',
        'Partial Pick - Closed': 'bg-red-200 text-red-900',
        'Short': 'bg-red-100 text-red-800',
        'Not Requested': 'bg-gray-100 text-gray-500',
        'Picking': 'bg-yellow-100 text-yellow-800',
        'Ready for Collection': 'bg-purple-100 text-purple-800',
        'Staged': 'bg-purple-100 text-purple-800',
        'Submitted': 'bg-cyan-100 text-cyan-800',
        'Pending Approval': 'bg-yellow-100 text-yellow-800',
        'Approved': 'bg-emerald-100 text-emerald-800',
        'On Hold': 'bg-gray-300 text-gray-900',
        'Cancelled': 'bg-gray-400 text-gray-700',
        'Open': 'bg-gray-200 text-gray-700',
        'Picked': 'bg-green-200 text-green-900',
        'Locked': 'bg-gray-200 text-gray-800 font-semibold'
    };
    const icons: { [key: string]: React.ReactNode } = {
        'Picked': React.createElement('span', { className: 'mr-1.5' }, '✔️'),
        'Exception': React.createElement('span', { className: 'mr-1.5' }, '⚠️'),
        'Partial Pick - Open': React.createElement('span', { className: 'mr-1.5' }, '🟠'),
        'Partial Pick - Closed': React.createElement('span', { className: 'mr-1.5' }, '🔴'),
        'Short': React.createElement('span', { className: 'mr-1.5' }, '⚠️'),
        'Staged': React.createElement('span', { className: 'mr-1.5' }, '✅'),
        'Pending Approval': React.createElement('span', { className: 'mr-1.5' }, '⏳'),
        'Approved': React.createElement('span', { className: 'mr-1.5' }, '✔️'),
        'On Hold': React.createElement('span', { className: 'mr-1.5' }, '⏸️'),
        'Cancelled': React.createElement('span', { className: 'mr-1.5' }, '❌'),
        'Locked': React.createElement(ICONS.LockClosedIcon, { className: 'h-4 w-4 mr-1.5' })
    };
    const effectiveStatus = lockInfo ? 'Locked' : status;

    return React.createElement('span', { 
        className: `px-2 py-1 text-xs font-medium rounded-full inline-flex items-center ${styles[effectiveStatus] || 'bg-gray-200 text-gray-800'}`,
        title: lockInfo ? `Locked by ${lockInfo.lockedBy}: ${lockInfo.comment}` : ''
     }, 
        icons[effectiveStatus],
        effectiveStatus
    );
};
