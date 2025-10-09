import type { Notification, NotificationTemplate, NotificationRule } from '../types/index';

// In-memory storage for notifications (in production, this would be in a database)
export let notifications: Notification[] = [];
export let notificationTemplates: NotificationTemplate[] = [];
export let notificationRules: NotificationRule[] = [];

// Template variable replacement
const replaceVariables = (template: string, variables: Record<string, string>): string => {
    let result = template;
    Object.keys(variables).forEach(key => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
    });
    return result;
};

// Send notification
export const sendNotification = async (
    type: 'email' | 'sms' | 'teams' | 'push',
    recipient: string,
    subject: string | undefined,
    message: string,
    mrfId?: string
): Promise<Notification> => {
    const notification: Notification = {
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        recipient,
        subject,
        message,
        status: 'pending',
        mrfId
    };

    notifications.unshift(notification);

    // Simulate sending (in production, this would call actual APIs)
    setTimeout(() => {
        const notif = notifications.find(n => n.id === notification.id);
        if (notif) {
            // 95% success rate simulation
            if (Math.random() > 0.05) {
                notif.status = 'sent';
                notif.sentAt = new Date().toISOString();
            } else {
                notif.status = 'failed';
                notif.error = 'Simulated delivery failure';
            }
        }
    }, 1000);

    return notification;
};

// Send notification from template
export const sendNotificationFromTemplate = async (
    templateId: string,
    recipient: string,
    variables: Record<string, string>,
    mrfId?: string
): Promise<Notification | null> => {
    const template = notificationTemplates.find(t => t.id === templateId);
    if (!template) {
        console.error(`Template ${templateId} not found`);
        return null;
    }

    const subject = template.subject ? replaceVariables(template.subject, variables) : undefined;
    const message = replaceVariables(template.body, variables);

    return sendNotification(template.type, recipient, subject, message, mrfId);
};

// Trigger notification based on event
export const triggerNotification = async (
    event: NotificationRule['event'],
    variables: Record<string, string>,
    mrfId?: string
): Promise<void> => {
    const rules = notificationRules.filter(r => r.event === event && r.enabled);

    for (const rule of rules) {
        for (const recipient of rule.recipients) {
            for (const channel of rule.channels) {
                const template = notificationTemplates.find(t => t.id === rule.templateId && t.type === channel);
                if (template) {
                    await sendNotificationFromTemplate(template.id, recipient, variables, mrfId);
                }
            }
        }
    }
};

// Get notifications
export const getNotifications = (filters?: {
    status?: Notification['status'];
    type?: Notification['type'];
    mrfId?: string;
}): Notification[] => {
    let filtered = [...notifications];

    if (filters) {
        if (filters.status) {
            filtered = filtered.filter(n => n.status === filters.status);
        }
        if (filters.type) {
            filtered = filtered.filter(n => n.type === filters.type);
        }
        if (filters.mrfId) {
            filtered = filtered.filter(n => n.mrfId === filters.mrfId);
        }
    }

    return filtered;
};

// Initialize default templates
export const initializeNotificationTemplates = () => {
    notificationTemplates = [
        {
            id: 'TMPL-001-EMAIL',
            name: 'Request Submitted - Email',
            type: 'email',
            subject: 'Material Request {{mrfId}} Submitted',
            body: 'Dear {{requestorName}},\n\nYour material request {{mrfId}} has been successfully submitted.\n\nPriority: {{priority}}\nItems: {{itemCount}}\nRequired By: {{requiredBy}}\nDelivery Location: {{deliveryLocation}}\n\nYou will receive updates as your request progresses.\n\nThank you!',
            variables: ['mrfId', 'requestorName', 'priority', 'itemCount', 'requiredBy', 'deliveryLocation']
        },
        {
            id: 'TMPL-002-SMS',
            name: 'Request Submitted - SMS',
            type: 'sms',
            body: 'Your material request {{mrfId}} ({{priority}}) has been submitted. Required by {{requiredBy}}. Track status at SCM Hub.',
            variables: ['mrfId', 'priority', 'requiredBy']
        },
        {
            id: 'TMPL-003-EMAIL',
            name: 'Status Change - Email',
            type: 'email',
            subject: 'Request {{mrfId}} Status Updated to {{newStatus}}',
            body: 'Dear {{requestorName}},\n\nYour material request {{mrfId}} status has been updated:\n\nPrevious Status: {{oldStatus}}\nNew Status: {{newStatus}}\n\nUpdated By: {{updatedBy}}\nTime: {{timestamp}}\n\nThank you!',
            variables: ['mrfId', 'requestorName', 'oldStatus', 'newStatus', 'updatedBy', 'timestamp']
        },
        {
            id: 'TMPL-004-SMS',
            name: 'Status Change - SMS',
            type: 'sms',
            body: 'Request {{mrfId}} is now {{newStatus}}. Updated by {{updatedBy}}.',
            variables: ['mrfId', 'newStatus', 'updatedBy']
        },
        {
            id: 'TMPL-005-TEAMS',
            name: 'P1 Request Created - Teams',
            type: 'teams',
            body: '🚨 **P1 URGENT REQUEST** 🚨\n\nRequest ID: {{mrfId}}\nRequestor: {{requestorName}}\nRequired By: {{requiredBy}}\nLocation: {{deliveryLocation}}\n\n**IMMEDIATE ATTENTION REQUIRED**',
            variables: ['mrfId', 'requestorName', 'requiredBy', 'deliveryLocation']
        },
        {
            id: 'TMPL-006-EMAIL',
            name: 'Delivered - Email',
            type: 'email',
            subject: 'Request {{mrfId}} Delivered',
            body: 'Dear {{requestorName}},\n\nYour material request {{mrfId}} has been delivered to {{deliveryLocation}}.\n\nDelivered By: {{deliveredBy}}\nDelivery Time: {{deliveryTime}}\n\nPlease confirm receipt in the SCM Hub system.\n\nThank you!',
            variables: ['mrfId', 'requestorName', 'deliveryLocation', 'deliveredBy', 'deliveryTime']
        },
        {
            id: 'TMPL-007-EMAIL',
            name: 'Short Pick Alert - Email',
            type: 'email',
            subject: 'Request {{mrfId}} - Short Pick Reported',
            body: 'Dear {{requestorName}},\n\nA short pick has been reported for your request {{mrfId}}.\n\nItem: {{itemDescription}}\nRequested Qty: {{requestedQty}}\nReason: {{shortReason}}\n\nThe Material Coordinator will contact you shortly.\n\nThank you for your patience!',
            variables: ['mrfId', 'requestorName', 'itemDescription', 'requestedQty', 'shortReason']
        }
    ];

    // Initialize default notification rules
    notificationRules = [
        {
            id: 'RULE-001',
            event: 'submitted',
            enabled: true,
            channels: ['email', 'sms'],
            recipients: [], // Will be set dynamically based on requestor
            templateId: 'TMPL-001'
        },
        {
            id: 'RULE-002',
            event: 'status_change',
            enabled: true,
            channels: ['email'],
            recipients: [],
            templateId: 'TMPL-003'
        },
        {
            id: 'RULE-003',
            event: 'p1_created',
            enabled: true,
            channels: ['teams', 'sms'],
            recipients: ['mc@toll.com', 'ac@toll.com'],
            templateId: 'TMPL-005'
        },
        {
            id: 'RULE-004',
            event: 'delivered',
            enabled: true,
            channels: ['email'],
            recipients: [],
            templateId: 'TMPL-006'
        },
        {
            id: 'RULE-005',
            event: 'short_pick',
            enabled: true,
            channels: ['email', 'teams'],
            recipients: [],
            templateId: 'TMPL-007'
        }
    ];
};

// Initialize on load
initializeNotificationTemplates();
