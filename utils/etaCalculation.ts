// ETA Calculation Utilities
// Calculates estimated delivery times based on priority, queue position, and current status

export interface ETAConfig {
  baseDeliveryMinutes: number;
  priorityMultipliers: {
    P1: number;
    P2: number;
    P3: number;
    P4: number;
  };
  queueDelayMinutes: number; // per request ahead in queue
  processingMinutes: number; // time to pick and stage
}

export interface ETAContext {
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  queuePosition: number;
  status: string;
  requestedBy?: string;
  currentTime?: Date;
}

const DEFAULT_CONFIG: ETAConfig = {
  baseDeliveryMinutes: 60, // 1 hour base delivery time
  priorityMultipliers: {
    P1: 0.5,  // 30 minutes for P1
    P2: 0.75, // 45 minutes for P2
    P3: 1.0,  // 60 minutes for P3
    P4: 1.5,  // 90 minutes for P4
  },
  queueDelayMinutes: 15, // 15 minutes per request ahead
  processingMinutes: 20, // 20 minutes to pick and stage
};

/**
 * Calculate estimated delivery time for a material request
 */
export function calculateETA(context: ETAContext, config: ETAConfig = DEFAULT_CONFIG): Date {
  const now = context.currentTime || new Date();
  
  // Start with base processing time
  let totalMinutes = config.processingMinutes;
  
  // Add queue delay (requests ahead in queue)
  if (context.queuePosition > 0) {
    totalMinutes += (context.queuePosition - 1) * config.queueDelayMinutes;
  }
  
  // Apply priority multiplier to delivery portion
  const baseDeliveryTime = config.baseDeliveryMinutes * config.priorityMultipliers[context.priority];
  totalMinutes += baseDeliveryTime;
  
  // Adjust based on current status
  switch (context.status) {
    case 'Submitted':
    case 'Pending Approval':
      // Full time from now
      break;
    case 'Approved':
      // Slightly reduced (already approved)
      totalMinutes *= 0.9;
      break;
    case 'Picking':
      // Much reduced (already being picked)
      totalMinutes = Math.max(15, totalMinutes * 0.3);
      break;
    case 'Staged':
      // Almost ready for delivery
      totalMinutes = Math.max(10, totalMinutes * 0.2);
      break;
    case 'In Transit':
      // Should arrive soon
      totalMinutes = Math.max(5, totalMinutes * 0.1);
      break;
    case 'Delivered':
    case 'Closed':
    case 'Cancelled':
      // No ETA needed
      return new Date(now.getTime() + 1000); // 1 second from now
    default:
      // Default case
      break;
  }
  
  return new Date(now.getTime() + totalMinutes * 60 * 1000);
}

/**
 * Format ETA for display
 */
export function formatETA(eta: Date, currentTime: Date = new Date()): string {
  const diffMs = eta.getTime() - currentTime.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  
  if (diffMinutes <= 0) {
    return 'Overdue';
  }
  
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }
  
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (hours < 24) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Check if ETA is overdue
 */
export function isETAOverdue(eta: Date, currentTime: Date = new Date()): boolean {
  return eta.getTime() <= currentTime.getTime();
}

/**
 * Get ETA status color class for UI
 */
export function getETAStatusClass(eta: Date, currentTime: Date = new Date()): string {
  const diffMs = eta.getTime() - currentTime.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  
  if (diffMinutes <= 0) {
    return 'text-red-600 bg-red-50 border-red-200'; // Overdue
  }
  
  if (diffMinutes < 30) {
    return 'text-orange-600 bg-orange-50 border-orange-200'; // Urgent
  }
  
  if (diffMinutes < 60) {
    return 'text-yellow-600 bg-yellow-50 border-yellow-200'; // Soon
  }
  
  return 'text-green-600 bg-green-50 border-green-200'; // Good
}

/**
 * Get ETA status icon
 */
export function getETAStatusIcon(eta: Date, currentTime: Date = new Date()): string {
  const diffMs = eta.getTime() - currentTime.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  
  if (diffMinutes <= 0) {
    return '⚠️'; // Overdue
  }
  
  if (diffMinutes < 30) {
    return '🚨'; // Urgent
  }
  
  if (diffMinutes < 60) {
    return '⏰'; // Soon
  }
  
  return '✅'; // Good
}

/**
 * Calculate ETA for a material request
 */
export function calculateRequestETA(request: {
  priority: string;
  status: string;
  queuePosition?: number;
  requestedBy?: string;
}): {
  eta: Date;
  formatted: string;
  isOverdue: boolean;
  statusClass: string;
  statusIcon: string;
} {
  const context: ETAContext = {
    priority: request.priority as 'P1' | 'P2' | 'P3' | 'P4',
    queuePosition: request.queuePosition || 1,
    status: request.status,
    requestedBy: request.requestedBy,
  };
  
  const eta = calculateETA(context);
  const formatted = formatETA(eta);
  const isOverdue = isETAOverdue(eta);
  const statusClass = getETAStatusClass(eta);
  const statusIcon = getETAStatusIcon(eta);
  
  return {
    eta,
    formatted,
    isOverdue,
    statusClass,
    statusIcon,
  };
}

/**
 * Update ETA configuration (for MLC to adjust based on site conditions)
 */
export function updateETAConfig(newConfig: Partial<ETAConfig>): ETAConfig {
  return {
    ...DEFAULT_CONFIG,
    ...newConfig,
    priorityMultipliers: {
      ...DEFAULT_CONFIG.priorityMultipliers,
      ...newConfig.priorityMultipliers,
    },
  };
}
