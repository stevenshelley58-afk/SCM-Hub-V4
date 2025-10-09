// Email and SMS Integration Service
// In production, this would integrate with SendGrid (email) and Twilio (SMS)

export interface EmailConfig {
    apiKey: string;
    from: string;
    replyTo?: string;
}

export interface SMSConfig {
    accountSid: string;
    authToken: string;
    from: string;
}

export interface EmailMessage {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    htmlBody?: string;
    attachments?: {
        filename: string;
        content: string;
        type: string;
    }[];
}

export interface SMSMessage {
    to: string;
    body: string;
}

export interface DeliveryStatus {
    id: string;
    messageId: string;
    status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';
    timestamp: string;
    error?: string;
}

let deliveryStatuses: DeliveryStatus[] = [];

// Send Email (simulated)
export const sendEmail = async (message: EmailMessage): Promise<string> => {
    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!message.to.every(email => emailRegex.test(email))) {
        throw new Error('Invalid email address');
    }

    const messageId = `EMAIL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Track delivery status
    const status: DeliveryStatus = {
        id: `STATUS-${Date.now()}`,
        messageId,
        status: 'queued',
        timestamp: new Date().toISOString()
    };
    deliveryStatuses.unshift(status);

    // Simulate delivery (95% success rate)
    setTimeout(() => {
        if (Math.random() > 0.05) {
            status.status = 'sent';
            setTimeout(() => {
                status.status = 'delivered';
            }, 2000);
        } else {
            status.status = 'failed';
            status.error = 'SMTP connection timeout';
        }
    }, 1000);

    return messageId;
};

// Send SMS (simulated)
export const sendSMS = async (message: SMSMessage): Promise<string> => {
    // Validate phone number (basic validation)
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    if (!phoneRegex.test(message.to)) {
        throw new Error('Invalid phone number');
    }

    // SMS character limit
    if (message.body.length > 160) {
        console.warn('SMS message exceeds 160 characters and will be sent as multiple messages');
    }

    const messageId = `SMS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Track delivery status
    const status: DeliveryStatus = {
        id: `STATUS-${Date.now()}`,
        messageId,
        status: 'queued',
        timestamp: new Date().toISOString()
    };
    deliveryStatuses.unshift(status);

    // Simulate delivery (98% success rate for SMS)
    setTimeout(() => {
        if (Math.random() > 0.02) {
            status.status = 'sent';
            setTimeout(() => {
                status.status = 'delivered';
            }, 1000);
        } else {
            status.status = 'failed';
            status.error = 'Invalid phone number or carrier blocked';
        }
    }, 500);

    return messageId;
};

// Send bulk emails
export const sendBulkEmail = async (messages: EmailMessage[]): Promise<string[]> => {
    const messageIds: string[] = [];
    
    for (const message of messages) {
        try {
            const messageId = await sendEmail(message);
            messageIds.push(messageId);
        } catch (error) {
            console.error('Failed to send email:', error);
            messageIds.push('FAILED');
        }
    }

    return messageIds;
};

// Send bulk SMS
export const sendBulkSMS = async (messages: SMSMessage[]): Promise<string[]> => {
    const messageIds: string[] = [];
    
    for (const message of messages) {
        try {
            const messageId = await sendSMS(message);
            messageIds.push(messageId);
        } catch (error) {
            console.error('Failed to send SMS:', error);
            messageIds.push('FAILED');
        }
    }

    return messageIds;
};

// Get delivery status
export const getDeliveryStatus = (messageId: string): DeliveryStatus | undefined => {
    return deliveryStatuses.find(s => s.messageId === messageId);
};

// Get all delivery statuses
export const getAllDeliveryStatuses = (limit: number = 50): DeliveryStatus[] => {
    return deliveryStatuses.slice(0, limit);
};

// Handle bounce
export const handleBounce = (messageId: string, reason: string): void => {
    const status = deliveryStatuses.find(s => s.messageId === messageId);
    if (status) {
        status.status = 'bounced';
        status.error = reason;
    }
};

// Get bounce rate
export const getBounceRate = (): number => {
    if (deliveryStatuses.length === 0) return 0;
    const bounced = deliveryStatuses.filter(s => s.status === 'bounced').length;
    return (bounced / deliveryStatuses.length) * 100;
};

// Get delivery rate
export const getDeliveryRate = (): number => {
    if (deliveryStatuses.length === 0) return 0;
    const delivered = deliveryStatuses.filter(s => s.status === 'delivered').length;
    return (delivered / deliveryStatuses.length) * 100;
};

// Validate email configuration
export const validateEmailConfig = (config: EmailConfig): boolean => {
    return !!(config.apiKey && config.from);
};

// Validate SMS configuration
export const validateSMSConfig = (config: SMSConfig): boolean => {
    return !!(config.accountSid && config.authToken && config.from);
};

// Initialize with sample delivery statuses
export const initializeSampleDeliveryStatuses = () => {
    const now = Date.now();
    
    for (let i = 0; i < 10; i++) {
        const isEmail = i % 2 === 0;
        deliveryStatuses.push({
            id: `STATUS-INIT-${i}`,
            messageId: isEmail ? `EMAIL-INIT-${i}` : `SMS-INIT-${i}`,
            status: i === 3 ? 'failed' : (i === 7 ? 'bounced' : 'delivered'),
            timestamp: new Date(now - (i * 300000)).toISOString(), // 5 minutes apart
            error: i === 3 ? 'Connection timeout' : (i === 7 ? 'Invalid email address' : undefined)
        });
    }
};

// Initialize sample data
initializeSampleDeliveryStatuses();
