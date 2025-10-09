/**
 * SLA Countdown Timer
 * Shows time remaining until SLA breach
 */

import React, { useState, useEffect } from 'react';

interface SLACountdownProps {
    slaTargetAt: string;
    status: string;
}

export const SLACountdown: React.FC<SLACountdownProps> = ({ slaTargetAt, status }) => {
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isOverdue, setIsOverdue] = useState(false);
    const [urgencyLevel, setUrgencyLevel] = useState<'safe' | 'warning' | 'critical'>('safe');

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date().getTime();
            const target = new Date(slaTargetAt).getTime();
            const diff = target - now;

            if (diff <= 0) {
                // SLA breached
                setIsOverdue(true);
                const overdueDiff = Math.abs(diff);
                const hours = Math.floor(overdueDiff / (1000 * 60 * 60));
                const minutes = Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeRemaining(`${hours}h ${minutes}m overdue`);
                setUrgencyLevel('critical');
            } else {
                // Still within SLA
                setIsOverdue(false);
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                
                setTimeRemaining(`${hours}h ${minutes}m remaining`);

                // Set urgency level
                if (diff <= 3600000) {
                    // Less than 1 hour
                    setUrgencyLevel('critical');
                } else if (diff <= 7200000) {
                    // Less than 2 hours
                    setUrgencyLevel('warning');
                } else {
                    setUrgencyLevel('safe');
                }
            }
        };

        // Update immediately
        updateCountdown();

        // Update every minute
        const interval = setInterval(updateCountdown, 60000);

        return () => clearInterval(interval);
    }, [slaTargetAt]);

    // Don't show for completed tasks
    if (['completed', 'verified', 'closed', 'cancelled'].includes(status)) {
        return null;
    }

    const getBackgroundColor = () => {
        if (isOverdue) return '#ff4444';
        if (urgencyLevel === 'critical') return '#ff9944';
        if (urgencyLevel === 'warning') return '#ffcc44';
        return '#44aa44';
    };

    const getIcon = () => {
        if (isOverdue) return '⚠️';
        if (urgencyLevel === 'critical') return '🔥';
        if (urgencyLevel === 'warning') return '⏰';
        return '✓';
    };

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: getBackgroundColor(),
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
        }}>
            <span>{getIcon()}</span>
            <span>{timeRemaining}</span>
        </div>
    );
};

