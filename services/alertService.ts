/**
 * Alert Service
 * Configure and send alerts via multiple channels
 */

export type AlertChannel = 'email' | 'sms' | 'slack' | 'teams' | 'webhook';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    severity: AlertSeverity;
    channels: AlertChannel[];
    condition: {
        metric: string;
        operator: '>' | '<' | '=' | '>=' | '<=';
        threshold: number;
    };
    recipients: string[]; // Email addresses, phone numbers, or channel IDs
    cooldownMinutes: number; // Minimum time between alerts
    lastTriggered?: string;
}

export interface Alert {
    id: string;
    timestamp: string;
    ruleId: string;
    ruleName: string;
    severity: AlertSeverity;
    message: string;
    value: number;
    threshold: number;
    channels: AlertChannel[];
    recipients: string[];
    status: 'sent' | 'failed' | 'pending';
}

// Mock alert rules
let alertRules: AlertRule[] = [
    {
        id: 'alert-1',
        name: 'High Backlog Alert',
        description: 'Alert when request backlog exceeds threshold',
        enabled: true,
        severity: 'warning',
        channels: ['email', 'slack'],
        condition: {
            metric: 'requestBacklog',
            operator: '>',
            threshold: 10
        },
        recipients: ['mc@company.com', '#warehouse-alerts'],
        cooldownMinutes: 30
    },
    {
        id: 'alert-2',
        name: 'Critical Backlog Alert',
        description: 'Critical alert when backlog is very high',
        enabled: true,
        severity: 'critical',
        channels: ['email', 'sms', 'teams'],
        condition: {
            metric: 'requestBacklog',
            operator: '>=',
            threshold: 20
        },
        recipients: ['mc@company.com', '+1234567890', 'operations-team'],
        cooldownMinutes: 15
    },
    {
        id: 'alert-3',
        name: 'P1 Approval Delay',
        description: 'Alert when P1 approval takes too long',
        enabled: true,
        severity: 'critical',
        channels: ['sms', 'slack'],
        condition: {
            metric: 'p1AvgApprovalTime',
            operator: '>',
            threshold: 30
        },
        recipients: ['mc@company.com', '#p1-alerts'],
        cooldownMinutes: 10
    },
    {
        id: 'alert-4',
        name: 'High Short Pick Rate',
        description: 'Alert when short pick rate is above acceptable',
        enabled: true,
        severity: 'warning',
        channels: ['email', 'teams'],
        condition: {
            metric: 'shortPickRate',
            operator: '>',
            threshold: 15
        },
        recipients: ['warehouse-lead@company.com', 'inventory-team'],
        cooldownMinutes: 60
    }
];

let alerts: Alert[] = [];

/**
 * Get all alert rules
 */
export const getAllAlertRules = (): AlertRule[] => {
    return [...alertRules];
};

/**
 * Get active alert rules
 */
export const getActiveAlertRules = (): AlertRule[] => {
    return alertRules.filter(rule => rule.enabled);
};

/**
 * Check conditions and trigger alerts
 */
export const checkAndTriggerAlerts = (metrics: Record<string, number>): Alert[] => {
    const triggeredAlerts: Alert[] = [];
    const now = new Date();
    
    getActiveAlertRules().forEach(rule => {
        // Check cooldown
        if (rule.lastTriggered) {
            const lastTriggeredTime = new Date(rule.lastTriggered);
            const minutesSinceLastTrigger = (now.getTime() - lastTriggeredTime.getTime()) / (1000 * 60);
            
            if (minutesSinceLastTrigger < rule.cooldownMinutes) {
                return; // Still in cooldown
            }
        }
        
        // Check condition
        const metricValue = metrics[rule.condition.metric];
        if (metricValue === undefined) return;
        
        let conditionMet = false;
        switch (rule.condition.operator) {
            case '>':
                conditionMet = metricValue > rule.condition.threshold;
                break;
            case '<':
                conditionMet = metricValue < rule.condition.threshold;
                break;
            case '=':
                conditionMet = metricValue === rule.condition.threshold;
                break;
            case '>=':
                conditionMet = metricValue >= rule.condition.threshold;
                break;
            case '<=':
                conditionMet = metricValue <= rule.condition.threshold;
                break;
        }
        
        if (conditionMet) {
            const alert = triggerAlert(rule, metricValue);
            triggeredAlerts.push(alert);
            
            // Update last triggered time
            rule.lastTriggered = now.toISOString();
        }
    });
    
    return triggeredAlerts;
};

/**
 * Trigger an alert
 */
const triggerAlert = (rule: AlertRule, value: number): Alert => {
    const alert: Alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        message: `${rule.description}: ${value} ${rule.condition.operator} ${rule.condition.threshold}`,
        value,
        threshold: rule.condition.threshold,
        channels: rule.channels,
        recipients: rule.recipients,
        status: 'pending'
    };
    
    // Send alert through channels
    sendAlert(alert);
    
    alerts.unshift(alert);
    
    // Keep only last 100 alerts
    if (alerts.length > 100) {
        alerts = alerts.slice(0, 100);
    }
    
    return alert;
};

/**
 * Send alert through configured channels
 */
const sendAlert = (alert: Alert): void => {
    console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
    
    alert.channels.forEach(channel => {
        switch (channel) {
            case 'email':
                sendEmailAlert(alert);
                break;
            case 'sms':
                sendSMSAlert(alert);
                break;
            case 'slack':
                sendSlackAlert(alert);
                break;
            case 'teams':
                sendTeamsAlert(alert);
                break;
            case 'webhook':
                sendWebhookAlert(alert);
                break;
        }
    });
    
    alert.status = 'sent';
};

// Mock alert sender functions
const sendEmailAlert = (alert: Alert) => {
    console.log(`📧 Sending email alert to: ${alert.recipients.filter(r => r.includes('@')).join(', ')}`);
};

const sendSMSAlert = (alert: Alert) => {
    console.log(`📱 Sending SMS alert to: ${alert.recipients.filter(r => r.startsWith('+')).join(', ')}`);
};

const sendSlackAlert = (alert: Alert) => {
    console.log(`💬 Sending Slack alert to: ${alert.recipients.filter(r => r.startsWith('#')).join(', ')}`);
};

const sendTeamsAlert = (alert: Alert) => {
    console.log(`👥 Sending Teams alert to: ${alert.recipients.filter(r => !r.includes('@') && !r.startsWith('+')).join(', ')}`);
};

const sendWebhookAlert = (alert: Alert) => {
    console.log(`🔗 Sending webhook alert`);
};

/**
 * Get recent alerts
 */
export const getRecentAlerts = (limit: number = 20): Alert[] => {
    return alerts.slice(0, limit);
};

/**
 * Add alert rule
 */
export const addAlertRule = (rule: Omit<AlertRule, 'id'>): string => {
    const id = `alert-${Date.now()}`;
    alertRules.push({ ...rule, id });
    return id;
};

/**
 * Update alert rule
 */
export const updateAlertRule = (
    id: string,
    updates: Partial<Omit<AlertRule, 'id'>>
): boolean => {
    const index = alertRules.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    alertRules[index] = { ...alertRules[index], ...updates };
    return true;
};

/**
 * Delete alert rule
 */
export const deleteAlertRule = (id: string): boolean => {
    const index = alertRules.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    alertRules.splice(index, 1);
    return true;
};

/**
 * Toggle alert rule
 */
export const toggleAlertRule = (id: string): boolean => {
    const rule = alertRules.find(r => r.id === id);
    if (!rule) return false;
    
    rule.enabled = !rule.enabled;
    return true;
};

/**
 * Test an alert (send immediately)
 */
export const testAlert = (ruleId: string): Alert | null => {
    const rule = alertRules.find(r => r.id === ruleId);
    if (!rule) return null;
    
    return triggerAlert(rule, rule.condition.threshold + 1);
};
