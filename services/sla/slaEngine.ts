/**
 * SLA Rules Engine
 * Automatic SLA calculation based on site-specific configuration
 */

import { siteConfigManager } from '../../config/siteConfig';
import type { LogisticsTask, LogisticsTaskPriority, LogisticsTaskType } from '../../types';
import type { SLARules } from '../../config/siteConfig';

export interface SLACalculationResult {
    sla_minutes: number;
    sla_target_at: string;
    business_minutes_used: number;
    calendar_minutes_used: number;
    percentage_used: number;
    is_breached: boolean;
    is_at_risk: boolean; // Above warning threshold
    time_remaining_minutes: number;
}

class SLAEngine {
    /**
     * Calculate SLA target time for a task
     */
    calculateSLATarget(
        task: {
            type: LogisticsTaskType;
            priority: LogisticsTaskPriority;
            created_at: string;
            requested_date?: string;
        }
    ): { sla_minutes: number; sla_target_at: string } {
        const config = siteConfigManager.getConfig();
        const slaRules = config.sla_rules;

        if (!slaRules.enabled) {
            // If SLA not enabled, use default 24 hours
            const target = new Date(new Date(task.created_at).getTime() + 24 * 60 * 60 * 1000);
            return {
                sla_minutes: 1440,
                sla_target_at: target.toISOString(),
            };
        }

        // Get SLA minutes based on priority and task type
        const slaMinutes = this.getSLAMinutes(task.type, task.priority, slaRules);

        // Calculate target datetime considering business hours
        const createdAt = new Date(task.created_at);
        const targetAt = this.calculateTargetDateTime(createdAt, slaMinutes, slaRules);

        return {
            sla_minutes: slaMinutes,
            sla_target_at: targetAt.toISOString(),
        };
    }

    /**
     * Get SLA status for a task
     */
    getSLAStatus(task: LogisticsTask): SLACalculationResult {
        const config = siteConfigManager.getConfig();
        const slaRules = config.sla_rules;

        if (!task.sla_target_at || !slaRules.enabled) {
            return {
                sla_minutes: 0,
                sla_target_at: task.sla_target_at || '',
                business_minutes_used: 0,
                calendar_minutes_used: 0,
                percentage_used: 0,
                is_breached: false,
                is_at_risk: false,
                time_remaining_minutes: 0,
            };
        }

        const now = new Date();
        const createdAt = new Date(task.created_at);
        const targetAt = new Date(task.sla_target_at);
        const completedAt = task.completed_at ? new Date(task.completed_at) : now;

        // Calculate elapsed time
        const elapsedMs = completedAt.getTime() - createdAt.getTime();
        const totalSlaMs = targetAt.getTime() - createdAt.getTime();

        const calendarMinutesUsed = Math.floor(elapsedMs / 60000);
        const businessMinutesUsed = this.calculateBusinessMinutes(createdAt, completedAt, slaRules);
        
        const slaMinutes = Math.floor(totalSlaMs / 60000);
        const percentageUsed = slaMinutes > 0 ? (calendarMinutesUsed / slaMinutes) * 100 : 0;

        const timeRemainingMs = targetAt.getTime() - now.getTime();
        const timeRemainingMinutes = Math.floor(timeRemainingMs / 60000);

        const isBreached = task.status !== 'completed' ? now > targetAt : completedAt > targetAt;
        const isAtRisk = percentageUsed >= slaRules.alerts.warn_at_percentage;

        return {
            sla_minutes: slaMinutes,
            sla_target_at: task.sla_target_at,
            business_minutes_used: businessMinutesUsed,
            calendar_minutes_used: calendarMinutesUsed,
            percentage_used: Math.round(percentageUsed),
            is_breached: isBreached,
            is_at_risk: isAtRisk && !isBreached,
            time_remaining_minutes: timeRemainingMinutes,
        };
    }

    /**
     * Check if task is at risk of SLA breach
     */
    checkSLARisk(task: LogisticsTask): {
        is_at_risk: boolean;
        percentage_used: number;
        time_remaining_minutes: number;
    } {
        const status = this.getSLAStatus(task);
        return {
            is_at_risk: status.is_at_risk,
            percentage_used: status.percentage_used,
            time_remaining_minutes: status.time_remaining_minutes,
        };
    }

    /**
     * Get tasks that are at risk or breached
     */
    getTasksAtRisk(tasks: LogisticsTask[]): {
        at_risk: LogisticsTask[];
        breached: LogisticsTask[];
    } {
        const atRisk: LogisticsTask[] = [];
        const breached: LogisticsTask[] = [];

        tasks.forEach(task => {
            if (task.status === 'completed' || task.status === 'closed' || task.status === 'cancelled') {
                return;
            }

            const status = this.getSLAStatus(task);
            if (status.is_breached) {
                breached.push(task);
            } else if (status.is_at_risk) {
                atRisk.push(task);
            }
        });

        return { at_risk: atRisk, breached };
    }

    /**
     * Calculate SLA compliance rate
     */
    calculateComplianceRate(tasks: LogisticsTask[]): {
        total: number;
        on_time: number;
        breached: number;
        compliance_rate: number;
    } {
        const completedTasks = tasks.filter(t => 
            t.status === 'completed' || t.status === 'closed'
        );

        if (completedTasks.length === 0) {
            return {
                total: 0,
                on_time: 0,
                breached: 0,
                compliance_rate: 100,
            };
        }

        let onTime = 0;
        let breached = 0;

        completedTasks.forEach(task => {
            const status = this.getSLAStatus(task);
            if (status.is_breached) {
                breached++;
            } else {
                onTime++;
            }
        });

        const complianceRate = (onTime / completedTasks.length) * 100;

        return {
            total: completedTasks.length,
            on_time: onTime,
            breached,
            compliance_rate: Math.round(complianceRate),
        };
    }

    /**
     * Format SLA time remaining
     */
    formatTimeRemaining(minutes: number): string {
        if (minutes < 0) {
            const absMinutes = Math.abs(minutes);
            const hours = Math.floor(absMinutes / 60);
            const mins = absMinutes % 60;
            return `OVERDUE by ${hours}h ${mins}m`;
        }

        if (minutes < 60) {
            return `${minutes}m remaining`;
        }

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours < 24) {
            return `${hours}h ${mins}m remaining`;
        }

        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h remaining`;
    }

    // ====================================
    // Private Helper Methods
    // ====================================

    /**
     * Get SLA minutes based on task type and priority
     */
    private getSLAMinutes(
        taskType: LogisticsTaskType,
        priority: LogisticsTaskPriority,
        slaRules: SLARules
    ): number {
        // Check if there's a specific SLA for this task type
        if (slaRules.task_type_slas && slaRules.task_type_slas[taskType]) {
            return slaRules.task_type_slas[taskType][priority];
        }

        // Fall back to default SLA
        return slaRules.default_slas[priority];
    }

    /**
     * Calculate target datetime considering business hours
     */
    private calculateTargetDateTime(
        startDate: Date,
        slaMinutes: number,
        slaRules: SLARules
    ): Date {
        const calculation = slaRules.calculation;
        
        // If not considering business hours, just add minutes
        if (!calculation.exclude_after_hours && !calculation.exclude_weekends) {
            return new Date(startDate.getTime() + slaMinutes * 60000);
        }

        // Calculate considering business hours
        let currentDate = new Date(startDate);
        let remainingMinutes = slaMinutes + (calculation.buffer_minutes || 0);

        while (remainingMinutes > 0) {
            // Check if this is a business day
            if (this.isBusinessDay(currentDate, slaRules)) {
                const businessHours = this.getBusinessHours(currentDate, slaRules);
                
                if (businessHours) {
                    // Check if current time is within business hours
                    const currentTime = currentDate.getHours() * 60 + currentDate.getMinutes();
                    const startMinutes = this.parseTime(businessHours.start);
                    const endMinutes = this.parseTime(businessHours.end);

                    if (currentTime < startMinutes) {
                        // Before business hours - move to start of business hours
                        currentDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
                    } else if (currentTime >= endMinutes) {
                        // After business hours - move to next day
                        currentDate.setDate(currentDate.getDate() + 1);
                        currentDate.setHours(0, 0, 0, 0);
                        continue;
                    } else {
                        // Within business hours
                        const minutesUntilEnd = endMinutes - currentTime;
                        
                        if (remainingMinutes <= minutesUntilEnd) {
                            // Can complete within today
                            currentDate = new Date(currentDate.getTime() + remainingMinutes * 60000);
                            remainingMinutes = 0;
                        } else {
                            // Move to end of business day
                            remainingMinutes -= minutesUntilEnd;
                            currentDate.setDate(currentDate.getDate() + 1);
                            currentDate.setHours(0, 0, 0, 0);
                        }
                    }
                } else {
                    // No business hours defined - treat as 24/7
                    currentDate = new Date(currentDate.getTime() + remainingMinutes * 60000);
                    remainingMinutes = 0;
                }
            } else {
                // Not a business day - skip to next day
                currentDate.setDate(currentDate.getDate() + 1);
                currentDate.setHours(0, 0, 0, 0);
            }
        }

        return currentDate;
    }

    /**
     * Calculate business minutes between two dates
     */
    private calculateBusinessMinutes(
        startDate: Date,
        endDate: Date,
        slaRules: SLARules
    ): number {
        const calculation = slaRules.calculation;
        
        // If not considering business hours, just calculate calendar minutes
        if (!calculation.exclude_after_hours && !calculation.exclude_weekends) {
            return Math.floor((endDate.getTime() - startDate.getTime()) / 60000);
        }

        let businessMinutes = 0;
        let currentDate = new Date(startDate);

        while (currentDate < endDate) {
            if (this.isBusinessDay(currentDate, slaRules)) {
                const businessHours = this.getBusinessHours(currentDate, slaRules);
                
                if (businessHours) {
                    const startMinutes = this.parseTime(businessHours.start);
                    const endMinutes = this.parseTime(businessHours.end);
                    const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

                    // Calculate minutes within business hours for this day
                    const dayEnd = new Date(currentDate);
                    dayEnd.setHours(23, 59, 59, 999);
                    
                    const periodEnd = endDate < dayEnd ? endDate : dayEnd;
                    
                    if (currentMinutes < endMinutes) {
                        const effectiveStart = Math.max(currentMinutes, startMinutes);
                        const effectiveEnd = Math.min(
                            periodEnd.getHours() * 60 + periodEnd.getMinutes(),
                            endMinutes
                        );
                        
                        if (effectiveEnd > effectiveStart) {
                            businessMinutes += effectiveEnd - effectiveStart;
                        }
                    }
                }
            }

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
            currentDate.setHours(0, 0, 0, 0);
        }

        return businessMinutes;
    }

    /**
     * Check if date is a business day
     */
    private isBusinessDay(date: Date, slaRules: SLARules): boolean {
        const calculation = slaRules.calculation;
        
        if (!calculation.exclude_weekends) {
            return true;
        }

        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Check if weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return false;
        }

        // TODO: Check holidays if exclude_holidays is true
        // This would require a holiday calendar

        return true;
    }

    /**
     * Get business hours for a specific date
     */
    private getBusinessHours(
        date: Date,
        slaRules: SLARules
    ): { start: string; end: string } | null {
        const businessHours = slaRules.business_hours;
        
        if (!businessHours.enabled) {
            return null;
        }

        const dayOfWeek = date.getDay();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[dayOfWeek] as keyof typeof businessHours;

        return businessHours[dayName] as { start: string; end: string } | null;
    }

    /**
     * Parse time string (HH:mm) to minutes
     */
    private parseTime(timeString: string): number {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }
}

export const slaEngine = new SLAEngine();

