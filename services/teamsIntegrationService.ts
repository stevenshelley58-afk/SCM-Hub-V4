// Microsoft Teams Integration Service
// In production, this would use Microsoft Teams Webhooks and Bot Framework

export interface TeamsMessage {
    title: string;
    text: string;
    color?: 'default' | 'good' | 'warning' | 'attention';
    facts?: { name: string; value: string }[];
    actions?: TeamsAction[];
}

export interface TeamsAction {
    type: 'openUrl' | 'httpPost';
    name: string;
    target?: string;
    body?: any;
}

export interface TeamsChannel {
    id: string;
    name: string;
    webhookUrl: string;
    enabled: boolean;
}

export interface TeamsNotification {
    id: string;
    channelId: string;
    message: TeamsMessage;
    sentAt: string;
    status: 'sent' | 'failed';
    error?: string;
}

let teamsChannels: TeamsChannel[] = [];
let teamsNotifications: TeamsNotification[] = [];

// Post message to Teams channel
export const postToTeams = async (
    channelId: string,
    message: TeamsMessage
): Promise<string> => {
    const channel = teamsChannels.find(c => c.id === channelId);
    if (!channel) {
        throw new Error('Channel not found');
    }

    if (!channel.enabled) {
        throw new Error('Channel is disabled');
    }

    const notificationId = `TEAMS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Simulate API call to Teams webhook
    await new Promise(resolve => setTimeout(resolve, 500));

    const notification: TeamsNotification = {
        id: notificationId,
        channelId,
        message,
        sentAt: new Date().toISOString(),
        status: Math.random() > 0.05 ? 'sent' : 'failed',
        error: Math.random() > 0.05 ? undefined : 'Webhook endpoint returned 400'
    };

    teamsNotifications.unshift(notification);

    if (notification.status === 'failed') {
        throw new Error(notification.error);
    }

    return notificationId;
};

// Create adaptive card for P1 request
export const createP1AlertCard = (mrfId: string, requestor: string, requiredBy: string, location: string): TeamsMessage => {
    return {
        title: '🚨 P1 URGENT REQUEST',
        text: `A new P1 priority request requires immediate attention`,
        color: 'attention',
        facts: [
            { name: 'Request ID', value: mrfId },
            { name: 'Requestor', value: requestor },
            { name: 'Required By', value: requiredBy },
            { name: 'Delivery Location', value: location }
        ],
        actions: [
            {
                type: 'openUrl',
                name: 'View in SCM Hub',
                target: `https://scmhub.toll.com/request/${mrfId}`
            }
        ]
    };
};

// Create status update card
export const createStatusUpdateCard = (mrfId: string, oldStatus: string, newStatus: string, updatedBy: string): TeamsMessage => {
    return {
        title: `Request ${mrfId} Status Updated`,
        text: `Status changed from ${oldStatus} to ${newStatus}`,
        color: newStatus === 'Delivered' ? 'good' : 'default',
        facts: [
            { name: 'Request ID', value: mrfId },
            { name: 'Previous Status', value: oldStatus },
            { name: 'New Status', value: newStatus },
            { name: 'Updated By', value: updatedBy },
            { name: 'Time', value: new Date().toLocaleString() }
        ],
        actions: [
            {
                type: 'openUrl',
                name: 'View Details',
                target: `https://scmhub.toll.com/request/${mrfId}`
            }
        ]
    };
};

// Create short pick alert card
export const createShortPickAlertCard = (mrfId: string, itemDescription: string, reason: string): TeamsMessage => {
    return {
        title: '⚠️ Short Pick Reported',
        text: `A short pick has been reported for request ${mrfId}`,
        color: 'warning',
        facts: [
            { name: 'Request ID', value: mrfId },
            { name: 'Item', value: itemDescription },
            { name: 'Reason', value: reason },
            { name: 'Time', value: new Date().toLocaleString() }
        ],
        actions: [
            {
                type: 'openUrl',
                name: 'Resolve Now',
                target: `https://scmhub.toll.com/request/${mrfId}`
            }
        ]
    };
};

// Create delivery complete card
export const createDeliveryCompleteCard = (mrfId: string, location: string, driver: string): TeamsMessage => {
    return {
        title: '✅ Delivery Complete',
        text: `Request ${mrfId} has been delivered`,
        color: 'good',
        facts: [
            { name: 'Request ID', value: mrfId },
            { name: 'Location', value: location },
            { name: 'Driver', value: driver },
            { name: 'Time', value: new Date().toLocaleString() }
        ]
    };
};

// Get Teams channels
export const getTeamsChannels = (): TeamsChannel[] => {
    return teamsChannels;
};

// Add Teams channel
export const addTeamsChannel = (name: string, webhookUrl: string): TeamsChannel => {
    const channel: TeamsChannel = {
        id: `CHANNEL-${Date.now()}`,
        name,
        webhookUrl,
        enabled: true
    };
    teamsChannels.push(channel);
    return channel;
};

// Update Teams channel
export const updateTeamsChannel = (channelId: string, updates: Partial<TeamsChannel>): void => {
    const channel = teamsChannels.find(c => c.id === channelId);
    if (channel) {
        Object.assign(channel, updates);
    }
};

// Delete Teams channel
export const deleteTeamsChannel = (channelId: string): void => {
    teamsChannels = teamsChannels.filter(c => c.id !== channelId);
};

// Get Teams notifications
export const getTeamsNotifications = (limit: number = 50): TeamsNotification[] => {
    return teamsNotifications.slice(0, limit);
};

// Test Teams webhook
export const testTeamsWebhook = async (webhookUrl: string): Promise<boolean> => {
    try {
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) {
                    resolve(true);
                } else {
                    reject(new Error('Webhook test failed'));
                }
            }, 1000);
        });
        return true;
    } catch (error) {
        return false;
    }
};

// Initialize sample channels
export const initializeSampleTeamsChannels = () => {
    teamsChannels = [
        {
            id: 'CHANNEL-001',
            name: 'Material Requests',
            webhookUrl: 'https://outlook.office.com/webhook/...',
            enabled: true
        },
        {
            id: 'CHANNEL-002',
            name: 'P1 Alerts',
            webhookUrl: 'https://outlook.office.com/webhook/...',
            enabled: true
        },
        {
            id: 'CHANNEL-003',
            name: 'Warehouse Operations',
            webhookUrl: 'https://outlook.office.com/webhook/...',
            enabled: true
        }
    ];

    // Sample notifications
    const now = Date.now();
    teamsNotifications = [
        {
            id: 'TEAMS-INIT-001',
            channelId: 'CHANNEL-002',
            message: createP1AlertCard('MRF-1232', 'Jane Doe', '2025-07-13 08:00', 'Unit 12 Work Area'),
            sentAt: new Date(now - 3600000).toISOString(),
            status: 'sent'
        },
        {
            id: 'TEAMS-INIT-002',
            channelId: 'CHANNEL-001',
            message: createStatusUpdateCard('MRF-1240', 'Submitted', 'Picking', 'Corey'),
            sentAt: new Date(now - 7200000).toISOString(),
            status: 'sent'
        }
    ];
};

// Initialize sample data
initializeSampleTeamsChannels();
