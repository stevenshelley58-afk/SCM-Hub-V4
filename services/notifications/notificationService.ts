/**
 * Notification Service
 * Modular notification system with endpoints ready for external integration
 * 
 * Note: This provides the infrastructure and endpoints.
 * Actual email/SMS/Teams sending will be connected to external services later.
 */

import { siteConfigManager } from '../../config/siteConfig';
import type { NotificationRule } from '../../config/siteConfig';
import type { LogisticsTask, Driver, PODRecord } from '../../types';

export interface NotificationPayload {
    notification_id: string;
    type: 'email' | 'sms' | 'push' | 'teams';
    event: string;
    recipient: {
        id?: string;
        name: string;
        email?: string;
        phone?: string;
    };
    subject?: string;
    message: string;
    data: Record<string, any>;
    priority: 'critical' | 'high' | 'normal' | 'low';
    created_at: string;
    sent_at?: string;
    status: 'pending' | 'sent' | 'failed';
    error?: string;
}

export interface NotificationEndpoint {
    endpoint_type: 'email' | 'sms' | 'teams' | 'push';
    url?: string;
    method: 'POST' | 'GET';
    headers?: Record<string, string>;
    payload: any;
}

class NotificationService {
    private queue: NotificationPayload[] = [];
    private sentNotifications: NotificationPayload[] = [];

    /**
     * Send notification (queues for external service)
     */
    async sendNotification(payload: Omit<NotificationPayload, 'notification_id' | 'created_at' | 'status'>): Promise<string> {
        const notification: NotificationPayload = {
            ...payload,
            notification_id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString(),
            status: 'pending',
        };

        // Add to queue
        this.queue.push(notification);
        
        // Log notification (for debugging)
        console.log(`📧 Notification queued:`, {
            type: notification.type,
            event: notification.event,
            recipient: notification.recipient.name,
            priority: notification.priority,
        });

        // Store in localStorage for persistence
        this.persistQueue();

        return notification.notification_id;
    }

    /**
     * Task Assigned Notification
     */
    async notifyTaskAssigned(task: LogisticsTask, driver: Driver): Promise<void> {
        const config = siteConfigManager.getConfig();
        
        if (!config.notifications.email.enabled) return;

        // Email to driver
        if (driver.email) {
            await this.sendNotification({
                type: 'email',
                event: 'task.assigned',
                recipient: {
                    id: driver.driver_id,
                    name: driver.name,
                    email: driver.email,
                },
                subject: `New Task Assigned: ${task.task_number}`,
                message: this.formatTaskAssignedEmail(task, driver),
                data: { task_id: task.task_id, task_number: task.task_number },
                priority: task.priority === 'critical' ? 'critical' : 'normal',
            });
        }

        // SMS to driver (if enabled and phone available)
        if (config.notifications.sms.enabled && driver.phone) {
            await this.sendNotification({
                type: 'sms',
                event: 'task.assigned',
                recipient: {
                    id: driver.driver_id,
                    name: driver.name,
                    phone: driver.phone,
                },
                message: `New task ${task.task_number}: ${task.description}. Pickup: ${task.pickup.location}`,
                data: { task_id: task.task_id },
                priority: task.priority === 'critical' ? 'critical' : 'normal',
            });
        }

        // Email to requester
        if (task.requester.email) {
            await this.sendNotification({
                type: 'email',
                event: 'task.assigned',
                recipient: {
                    name: task.requester.name,
                    email: task.requester.email,
                },
                subject: `Task Accepted: ${task.task_number}`,
                message: this.formatTaskAcceptedEmail(task, driver),
                data: { task_id: task.task_id },
                priority: 'normal',
            });
        }
    }

    /**
     * Task Completed Notification
     */
    async notifyTaskCompleted(task: LogisticsTask, pod?: PODRecord): Promise<void> {
        const config = siteConfigManager.getConfig();
        
        if (!config.notifications.email.enabled) return;

        // Email to requester
        if (task.requester.email) {
            await this.sendNotification({
                type: 'email',
                event: 'task.completed',
                recipient: {
                    name: task.requester.name,
                    email: task.requester.email,
                },
                subject: `Task Completed: ${task.task_number}`,
                message: this.formatTaskCompletedEmail(task, pod),
                data: {
                    task_id: task.task_id,
                    pod_id: pod?.pod_id,
                },
                priority: 'normal',
            });
        }
    }

    /**
     * SLA Breach Warning
     */
    async notifySLAWarning(task: LogisticsTask, percentageUsed: number): Promise<void> {
        const config = siteConfigManager.getConfig();
        
        if (!config.sla_rules.alerts.warn_at_percentage) return;

        // Notify MLC team
        await this.sendNotification({
            type: 'email',
            event: 'sla.warning',
            recipient: {
                name: 'MLC Team',
                email: 'mlc-team@example.com', // Configure per site
            },
            subject: `⚠️ SLA Warning: ${task.task_number}`,
            message: `Task ${task.task_number} is at ${percentageUsed}% of SLA time.\n\nPriority: ${task.priority}\nSLA Target: ${task.sla_target_at}\n\nPlease check the task.`,
            data: {
                task_id: task.task_id,
                percentage_used: percentageUsed,
            },
            priority: 'high',
        });

        // Teams notification if enabled
        if (config.notifications.teams.enabled) {
            await this.sendNotification({
                type: 'teams',
                event: 'sla.warning',
                recipient: {
                    name: 'MLC Team',
                },
                message: `⚠️ SLA Warning: Task ${task.task_number} is at ${percentageUsed}% of SLA time.`,
                data: {
                    task_id: task.task_id,
                    task_url: `/logistics-dispatcher?task=${task.task_id}`,
                },
                priority: 'high',
            });
        }
    }

    /**
     * SLA Breach Notification
     */
    async notifySLABreach(task: LogisticsTask): Promise<void> {
        const config = siteConfigManager.getConfig();
        
        if (!config.sla_rules.alerts.breach_notification) return;

        // Critical notification to MLC team
        await this.sendNotification({
            type: 'email',
            event: 'sla.breach',
            recipient: {
                name: 'MLC Team',
                email: 'mlc-team@example.com',
            },
            subject: `🚨 SLA BREACH: ${task.task_number}`,
            message: `CRITICAL: Task ${task.task_number} has breached its SLA!\n\nPriority: ${task.priority}\nSLA Target: ${task.sla_target_at}\nStatus: ${task.status}\n\nImmediate action required.`,
            data: {
                task_id: task.task_id,
            },
            priority: 'critical',
        });

        // SMS alert
        if (config.notifications.sms.enabled) {
            await this.sendNotification({
                type: 'sms',
                event: 'sla.breach',
                recipient: {
                    name: 'MLC On-Call',
                    phone: '+61400000000', // Configure per site
                },
                message: `🚨 SLA BREACH: ${task.task_number}. Check system immediately.`,
                data: {
                    task_id: task.task_id,
                },
                priority: 'critical',
            });
        }
    }

    /**
     * Exception Notification
     */
    async notifyException(task: LogisticsTask, exceptionType: string, description: string): Promise<void> {
        const config = siteConfigManager.getConfig();

        // Email to MLC team
        await this.sendNotification({
            type: 'email',
            event: 'task.exception',
            recipient: {
                name: 'MLC Team',
                email: 'mlc-team@example.com',
            },
            subject: `⚠️ Exception: ${task.task_number}`,
            message: `Exception reported for task ${task.task_number}:\n\nType: ${exceptionType}\nDescription: ${description}\n\nDriver: ${task.driver?.name}\nLocation: ${task.pickup.location}`,
            data: {
                task_id: task.task_id,
                exception_type: exceptionType,
            },
            priority: 'high',
        });

        // Notify requester
        if (task.requester.email) {
            await this.sendNotification({
                type: 'email',
                event: 'task.exception',
                recipient: {
                    name: task.requester.name,
                    email: task.requester.email,
                },
                subject: `Issue with Task: ${task.task_number}`,
                message: `There's an issue with your logistics request ${task.task_number}.\n\nIssue: ${description}\n\nWe're working to resolve it.`,
                data: {
                    task_id: task.task_id,
                },
                priority: 'normal',
            });
        }
    }

    /**
     * Daily Summary Email
     */
    async sendDailySummary(summary: {
        total_tasks: number;
        completed: number;
        in_progress: number;
        exceptions: number;
        sla_compliance: number;
    }): Promise<void> {
        const config = siteConfigManager.getConfig();
        
        if (!config.notifications.email.enabled) return;

        await this.sendNotification({
            type: 'email',
            event: 'daily.summary',
            recipient: {
                name: 'MLC Team',
                email: 'mlc-team@example.com',
            },
            subject: `Daily Logistics Summary - ${new Date().toLocaleDateString()}`,
            message: this.formatDailySummaryEmail(summary),
            data: summary,
            priority: 'normal',
        });
    }

    /**
     * Get notification endpoints for external integration
     */
    getNotificationEndpoint(notificationId: string): NotificationEndpoint | null {
        const notification = this.queue.find(n => n.notification_id === notificationId);
        if (!notification) return null;

        const config = siteConfigManager.getConfig();

        switch (notification.type) {
            case 'email':
                return {
                    endpoint_type: 'email',
                    url: '/api/notifications/email', // External API endpoint
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'your-api-key', // Configure per site
                    },
                    payload: {
                        to: notification.recipient.email,
                        from: config.notifications.email.from_address,
                        subject: notification.subject,
                        html: notification.message,
                        text: notification.message,
                    },
                };

            case 'sms':
                return {
                    endpoint_type: 'sms',
                    url: '/api/notifications/sms',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'your-api-key',
                    },
                    payload: {
                        to: notification.recipient.phone,
                        from: config.notifications.sms.from_number,
                        message: notification.message,
                    },
                };

            case 'teams':
                return {
                    endpoint_type: 'teams',
                    url: config.notifications.teams.webhook_url || '',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    payload: {
                        '@type': 'MessageCard',
                        '@context': 'https://schema.org/extensions',
                        summary: notification.subject || notification.message,
                        sections: [{
                            activityTitle: notification.subject || 'Logistics Notification',
                            activitySubtitle: notification.message,
                            facts: Object.entries(notification.data).map(([key, value]) => ({
                                name: key,
                                value: String(value),
                            })),
                        }],
                    },
                };

            case 'push':
                return {
                    endpoint_type: 'push',
                    url: '/api/notifications/push',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    payload: {
                        title: notification.subject || 'Notification',
                        body: notification.message,
                        data: notification.data,
                    },
                };

            default:
                return null;
        }
    }

    /**
     * Get pending notifications (for external processing)
     */
    getPendingNotifications(): NotificationPayload[] {
        return this.queue.filter(n => n.status === 'pending');
    }

    /**
     * Mark notification as sent
     */
    markAsSent(notificationId: string): void {
        const notification = this.queue.find(n => n.notification_id === notificationId);
        if (notification) {
            notification.status = 'sent';
            notification.sent_at = new Date().toISOString();
            this.sentNotifications.push(notification);
            this.queue = this.queue.filter(n => n.notification_id !== notificationId);
            this.persistQueue();
        }
    }

    /**
     * Mark notification as failed
     */
    markAsFailed(notificationId: string, error: string): void {
        const notification = this.queue.find(n => n.notification_id === notificationId);
        if (notification) {
            notification.status = 'failed';
            notification.error = error;
            this.persistQueue();
        }
    }

    /**
     * Get notification history
     */
    getHistory(limit: number = 100): NotificationPayload[] {
        return [...this.sentNotifications, ...this.queue]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, limit);
    }

    // ====================================
    // Email Formatting
    // ====================================

    private formatTaskAssignedEmail(task: LogisticsTask, driver: Driver): string {
        return `
            <h2>New Task Assigned</h2>
            <p>Hi ${driver.name},</p>
            <p>You have been assigned a new logistics task:</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #0066cc;">
                <strong>Task:</strong> ${task.task_number}<br>
                <strong>Priority:</strong> ${task.priority.toUpperCase()}<br>
                <strong>Type:</strong> ${task.type}<br>
                <strong>Description:</strong> ${task.description}<br><br>
                
                <strong>Pickup:</strong> ${task.pickup.location}<br>
                ${task.pickup.contact ? `<strong>Contact:</strong> ${task.pickup.contact}<br>` : ''}
                
                <strong>Dropoff:</strong> ${task.dropoff.location}<br>
                ${task.dropoff.contact ? `<strong>Contact:</strong> ${task.dropoff.contact}<br>` : ''}
                
                ${task.sla_target_at ? `<br><strong>Complete By:</strong> ${new Date(task.sla_target_at).toLocaleString()}<br>` : ''}
            </div>
            
            <p>Please check the driver app for full details.</p>
        `;
    }

    private formatTaskAcceptedEmail(task: LogisticsTask, driver: Driver): string {
        return `
            <h2>Task Accepted</h2>
            <p>Hi ${task.requester.name},</p>
            <p>Your logistics request has been accepted and assigned to a driver:</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #44aa44;">
                <strong>Task:</strong> ${task.task_number}<br>
                <strong>Driver:</strong> ${driver.name}<br>
                ${driver.phone ? `<strong>Driver Phone:</strong> ${driver.phone}<br>` : ''}
                <strong>Pickup Location:</strong> ${task.pickup.location}<br>
                <strong>Delivery Location:</strong> ${task.dropoff.location}<br>
                ${task.sla_target_at ? `<strong>Expected Completion:</strong> ${new Date(task.sla_target_at).toLocaleString()}<br>` : ''}
            </div>
            
            <p>You'll receive another notification when the delivery is completed.</p>
        `;
    }

    private formatTaskCompletedEmail(task: LogisticsTask, pod?: PODRecord): string {
        return `
            <h2>Task Completed</h2>
            <p>Hi ${task.requester.name},</p>
            <p>Your logistics request has been completed:</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #44aa44;">
                <strong>Task:</strong> ${task.task_number}<br>
                <strong>Completed At:</strong> ${task.completed_at ? new Date(task.completed_at).toLocaleString() : 'N/A'}<br>
                ${pod ? `
                    <strong>Delivered To:</strong> ${pod.delivered_to}<br>
                    ${pod.photo_count ? `<strong>Photos:</strong> ${pod.photo_count} captured<br>` : ''}
                    ${pod.delivery_notes ? `<strong>Notes:</strong> ${pod.delivery_notes}<br>` : ''}
                ` : ''}
            </div>
            
            <p>View the full proof of delivery in the system.</p>
        `;
    }

    private formatDailySummaryEmail(summary: any): string {
        return `
            <h2>Daily Logistics Summary</h2>
            <p>Summary for ${new Date().toLocaleDateString()}:</p>
            
            <div style="background: #f9f9f9; padding: 15px;">
                <h3>Overview</h3>
                <strong>Total Tasks:</strong> ${summary.total_tasks}<br>
                <strong>Completed:</strong> ${summary.completed} (${summary.total_tasks > 0 ? Math.round(summary.completed / summary.total_tasks * 100) : 0}%)<br>
                <strong>In Progress:</strong> ${summary.in_progress}<br>
                <strong>Exceptions:</strong> ${summary.exceptions}<br>
                <strong>SLA Compliance:</strong> ${summary.sla_compliance}%<br>
            </div>
            
            <p>View detailed reports in the system.</p>
        `;
    }

    // ====================================
    // Persistence
    // ====================================

    private persistQueue(): void {
        try {
            localStorage.setItem('notification_queue', JSON.stringify(this.queue));
            localStorage.setItem('notification_history', JSON.stringify(this.sentNotifications.slice(-100)));
        } catch (error) {
            console.error('Error persisting notification queue:', error);
        }
    }

    private loadQueue(): void {
        try {
            const stored = localStorage.getItem('notification_queue');
            if (stored) {
                this.queue = JSON.parse(stored);
            }

            const history = localStorage.getItem('notification_history');
            if (history) {
                this.sentNotifications = JSON.parse(history);
            }
        } catch (error) {
            console.error('Error loading notification queue:', error);
        }
    }
}

export const notificationService = new NotificationService();

// Load queue on initialization
(notificationService as any).loadQueue();

