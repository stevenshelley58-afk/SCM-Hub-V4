import React from 'react';
import { calculateRequestETA } from '../../utils/etaCalculation';

interface ETABadgeProps {
  request: {
    priority: string;
    status: string;
    queuePosition?: number;
    requestedBy?: string;
  };
  showIcon?: boolean;
  className?: string;
}

export const ETABadge: React.FC<ETABadgeProps> = ({ 
  request, 
  showIcon = true, 
  className = '' 
}) => {
  const etaData = calculateRequestETA(request);
  
  return React.createElement('div', {
    className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${etaData.statusClass} ${className}`,
    title: `ETA: ${etaData.eta.toLocaleString()}`
  }, [
    showIcon && React.createElement('span', {
      key: 'icon',
      className: 'mr-1'
    }, etaData.statusIcon),
    React.createElement('span', {
      key: 'text'
    }, etaData.formatted)
  ]);
};

export default ETABadge;
