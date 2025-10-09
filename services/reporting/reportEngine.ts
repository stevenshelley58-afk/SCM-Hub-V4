/**
 * Modular Report Engine
 * Flexible, configurable reporting system for multi-site deployment
 */

import { siteConfigManager } from '../../config/siteConfig';
import { taskService } from '../logistics/taskService';
import type { LogisticsTask } from '../../types';
import type { ReportTemplate } from '../../config/siteConfig';

export interface ReportData {
    title: string;
    generated_at: string;
    site_id: string;
    date_range: {
        start: string;
        end: string;
    };
    data: any[];
    summary: Record<string, any>;
    charts?: ChartData[];
}

export interface ChartData {
    type: 'bar' | 'line' | 'pie' | 'donut';
    title: string;
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string;
    }[];
}

export interface KPI {
    id: string;
    label: string;
    value: number | string;
    change?: number; // Percentage change from previous period
    trend?: 'up' | 'down' | 'neutral';
    format?: 'number' | 'percentage' | 'currency' | 'duration';
    color?: string;
    icon?: string;
}

class ReportEngine {
    /**
     * Generate KPI dashboard data
     */
    async generateKPIDashboard(dateRange?: { start: string; end: string }): Promise<KPI[]> {
        const config = siteConfigManager.getConfig();
        const enabledKPIs = config.reporting.dashboard.default_kpis;

        const kpis: KPI[] = [];

        // Get tasks for the period
        const tasks = await this.getTasksForPeriod(dateRange);

        if (enabledKPIs.includes('total_tasks')) {
            kpis.push({
                id: 'total_tasks',
                label: 'Total Tasks',
                value: tasks.length,
                format: 'number',
                icon: '📋',
                color: '#0066cc',
            });
        }

        if (enabledKPIs.includes('completed_tasks')) {
            const completed = tasks.filter(t => t.status === 'completed' || t.status === 'closed').length;
            const completionRate = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
            
            kpis.push({
                id: 'completed_tasks',
                label: 'Completed',
                value: completed,
                change: completionRate,
                trend: completionRate > 80 ? 'up' : completionRate > 50 ? 'neutral' : 'down',
                format: 'number',
                icon: '✅',
                color: '#44aa44',
            });
        }

        if (enabledKPIs.includes('in_progress')) {
            const inProgress = tasks.filter(t => t.status === 'in_progress').length;
            
            kpis.push({
                id: 'in_progress',
                label: 'In Progress',
                value: inProgress,
                format: 'number',
                icon: '🚚',
                color: '#ff9944',
            });
        }

        if (enabledKPIs.includes('exceptions')) {
            const exceptions = tasks.filter(t => t.status === 'exception').length;
            const exceptionRate = tasks.length > 0 ? (exceptions / tasks.length) * 100 : 0;
            
            kpis.push({
                id: 'exceptions',
                label: 'Exceptions',
                value: exceptions,
                change: exceptionRate,
                trend: exceptionRate < 5 ? 'up' : exceptionRate < 10 ? 'neutral' : 'down',
                format: 'number',
                icon: '⚠️',
                color: '#ff4444',
            });
        }

        if (enabledKPIs.includes('sla_compliance')) {
            const slaCompliance = this.calculateSLACompliance(tasks);
            
            kpis.push({
                id: 'sla_compliance',
                label: 'SLA Compliance',
                value: `${slaCompliance}%`,
                change: slaCompliance,
                trend: slaCompliance > 90 ? 'up' : slaCompliance > 75 ? 'neutral' : 'down',
                format: 'percentage',
                icon: '⏱️',
                color: slaCompliance > 90 ? '#44aa44' : slaCompliance > 75 ? '#ff9944' : '#ff4444',
            });
        }

        if (enabledKPIs.includes('avg_turnaround')) {
            const avgTurnaround = this.calculateAverageTurnaround(tasks);
            
            kpis.push({
                id: 'avg_turnaround',
                label: 'Avg Turnaround',
                value: this.formatDuration(avgTurnaround),
                format: 'duration',
                icon: '⏰',
                color: '#0066cc',
            });
        }

        return kpis;
    }

    /**
     * Generate report from template
     */
    async generateReport(templateId: string, filters?: Record<string, any>): Promise<ReportData> {
        const config = siteConfigManager.getConfig();
        const template = config.reporting.templates.find(t => t.id === templateId);

        if (!template) {
            throw new Error(`Report template ${templateId} not found`);
        }

        const tasks = await this.getTasksForPeriod();
        const filteredTasks = this.applyFilters(tasks, { ...template.filters, ...filters });
        const groupedData = this.groupData(filteredTasks, template.grouping);
        const sortedData = this.sortData(groupedData, template.sorting);

        const report: ReportData = {
            title: template.name,
            generated_at: new Date().toISOString(),
            site_id: config.site_id,
            date_range: {
                start: filters?.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                end: filters?.end_date || new Date().toISOString(),
            },
            data: sortedData,
            summary: this.generateSummary(filteredTasks),
        };

        // Generate charts if specified
        if (template.charts && template.charts.length > 0) {
            report.charts = template.charts.map(chartConfig => 
                this.generateChart(filteredTasks, chartConfig)
            );
        }

        return report;
    }

    /**
     * Generate driver performance report
     */
    async generateDriverPerformanceReport(dateRange?: { start: string; end: string }): Promise<ReportData> {
        const tasks = await this.getTasksForPeriod(dateRange);
        
        // Group by driver
        const driverStats = new Map<string, any>();

        tasks.forEach(task => {
            if (!task.driver) return;

            const driverId = task.driver.driver_id;
            if (!driverStats.has(driverId)) {
                driverStats.set(driverId, {
                    driver_id: driverId,
                    driver_name: task.driver.name,
                    total_tasks: 0,
                    completed_tasks: 0,
                    in_progress_tasks: 0,
                    exception_tasks: 0,
                    avg_completion_time: 0,
                    sla_compliance_rate: 0,
                    pod_quality_score: 0,
                });
            }

            const stats = driverStats.get(driverId);
            stats.total_tasks++;

            if (task.status === 'completed' || task.status === 'closed') {
                stats.completed_tasks++;
            } else if (task.status === 'in_progress') {
                stats.in_progress_tasks++;
            } else if (task.status === 'exception') {
                stats.exception_tasks++;
            }
        });

        // Calculate metrics
        const driverData = Array.from(driverStats.values()).map(stats => {
            stats.completion_rate = stats.total_tasks > 0 ? 
                (stats.completed_tasks / stats.total_tasks * 100).toFixed(1) + '%' : '0%';
            stats.exception_rate = stats.total_tasks > 0 ? 
                (stats.exception_tasks / stats.total_tasks * 100).toFixed(1) + '%' : '0%';
            return stats;
        });

        return {
            title: 'Driver Performance Report',
            generated_at: new Date().toISOString(),
            site_id: siteConfigManager.getCurrentSiteId(),
            date_range: dateRange || {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                end: new Date().toISOString(),
            },
            data: driverData,
            summary: {
                total_drivers: driverData.length,
                avg_tasks_per_driver: driverData.length > 0 ? 
                    (driverData.reduce((sum, d) => sum + d.total_tasks, 0) / driverData.length).toFixed(1) : 0,
                top_performer: driverData.sort((a, b) => b.completed_tasks - a.completed_tasks)[0]?.driver_name || 'N/A',
            },
        };
    }

    /**
     * Generate daily summary report
     */
    async generateDailySummary(date?: string): Promise<ReportData> {
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();

        const tasks = await this.getTasksForPeriod({ start: startOfDay, end: endOfDay });

        const summary = {
            total_tasks: tasks.length,
            new_tasks: tasks.filter(t => t.status === 'new').length,
            scheduled_tasks: tasks.filter(t => t.status === 'scheduled').length,
            in_progress_tasks: tasks.filter(t => t.status === 'in_progress').length,
            completed_tasks: tasks.filter(t => t.status === 'completed' || t.status === 'closed').length,
            exception_tasks: tasks.filter(t => t.status === 'exception').length,
            on_hold_tasks: tasks.filter(t => t.status === 'on_hold').length,
            cancelled_tasks: tasks.filter(t => t.status === 'cancelled').length,
            
            by_priority: {
                critical: tasks.filter(t => t.priority === 'critical').length,
                high: tasks.filter(t => t.priority === 'high').length,
                normal: tasks.filter(t => t.priority === 'normal').length,
                low: tasks.filter(t => t.priority === 'low').length,
            },
            
            sla_compliance: this.calculateSLACompliance(tasks),
            avg_turnaround: this.calculateAverageTurnaround(tasks),
        };

        return {
            title: `Daily Summary - ${targetDate.toLocaleDateString()}`,
            generated_at: new Date().toISOString(),
            site_id: siteConfigManager.getCurrentSiteId(),
            date_range: { start: startOfDay, end: endOfDay },
            data: tasks,
            summary,
        };
    }

    /**
     * Export report to CSV
     */
    exportToCSV(report: ReportData): string {
        if (report.data.length === 0) return '';

        // Get headers from first row
        const headers = Object.keys(report.data[0]);
        
        // Create CSV content
        let csv = headers.join(',') + '\n';
        
        report.data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value || '';
            });
            csv += values.join(',') + '\n';
        });

        return csv;
    }

    /**
     * Download report as CSV
     */
    downloadCSV(report: ReportData): void {
        const csv = this.exportToCSV(report);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // ====================================
    // Helper Methods
    // ====================================

    private async getTasksForPeriod(dateRange?: { start: string; end: string }): Promise<LogisticsTask[]> {
        // In production, this would query with date filters
        const allTasks = await taskService.listTasks({});
        
        if (!dateRange) return allTasks;

        return allTasks.filter(task => {
            const taskDate = new Date(task.created_at);
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            return taskDate >= start && taskDate <= end;
        });
    }

    private calculateSLACompliance(tasks: LogisticsTask[]): number {
        if (tasks.length === 0) return 100;

        const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'closed');
        if (completedTasks.length === 0) return 100;

        const onTimeCount = completedTasks.filter(task => {
            if (!task.sla_target_at || !task.completed_at) return true;
            return new Date(task.completed_at) <= new Date(task.sla_target_at);
        }).length;

        return Math.round((onTimeCount / completedTasks.length) * 100);
    }

    private calculateAverageTurnaround(tasks: LogisticsTask[]): number {
        const completedTasks = tasks.filter(t => 
            (t.status === 'completed' || t.status === 'closed') && 
            t.completed_at && 
            t.created_at
        );

        if (completedTasks.length === 0) return 0;

        const totalTime = completedTasks.reduce((sum, task) => {
            const created = new Date(task.created_at).getTime();
            const completed = new Date(task.completed_at!).getTime();
            return sum + (completed - created);
        }, 0);

        return Math.round(totalTime / completedTasks.length);
    }

    private formatDuration(milliseconds: number): string {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        }
        
        return `${hours}h ${minutes}m`;
    }

    private applyFilters(tasks: LogisticsTask[], filters: Record<string, any>): LogisticsTask[] {
        let filtered = [...tasks];

        if (filters.status) {
            filtered = filtered.filter(t => t.status === filters.status);
        }

        if (filters.priority) {
            filtered = filtered.filter(t => t.priority === filters.priority);
        }

        if (filters.type) {
            filtered = filtered.filter(t => t.type === filters.type);
        }

        if (filters.driver_id) {
            filtered = filtered.filter(t => t.driver?.driver_id === filters.driver_id);
        }

        return filtered;
    }

    private groupData(tasks: LogisticsTask[], grouping?: string[]): any[] {
        if (!grouping || grouping.length === 0) {
            return tasks;
        }

        // Simple grouping by first field
        const grouped = new Map<string, any[]>();
        const groupField = grouping[0];

        tasks.forEach(task => {
            const key = (task as any)[groupField] || 'Unknown';
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(task);
        });

        return Array.from(grouped.entries()).map(([key, items]) => ({
            [groupField]: key,
            count: items.length,
            items,
        }));
    }

    private sortData(data: any[], sorting?: { field: string; direction: 'asc' | 'desc' }[]): any[] {
        if (!sorting || sorting.length === 0) {
            return data;
        }

        const sorted = [...data];
        const { field, direction } = sorting[0];

        sorted.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];

            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }

    private generateSummary(tasks: LogisticsTask[]): Record<string, any> {
        return {
            total_count: tasks.length,
            by_status: this.countByField(tasks, 'status'),
            by_priority: this.countByField(tasks, 'priority'),
            by_type: this.countByField(tasks, 'type'),
        };
    }

    private countByField(tasks: LogisticsTask[], field: keyof LogisticsTask): Record<string, number> {
        const counts: Record<string, number> = {};
        
        tasks.forEach(task => {
            const value = String(task[field] || 'Unknown');
            counts[value] = (counts[value] || 0) + 1;
        });

        return counts;
    }

    private generateChart(tasks: LogisticsTask[], config: any): ChartData {
        const dataField = config.data_field;
        const labelField = config.label_field;

        // Count by label field
        const counts = this.countByField(tasks, labelField);

        return {
            type: config.type,
            title: `Tasks by ${labelField}`,
            labels: Object.keys(counts),
            datasets: [{
                label: 'Count',
                data: Object.values(counts),
                backgroundColor: this.generateColors(Object.keys(counts).length),
            }],
        };
    }

    private generateColors(count: number): string[] {
        const colors = [
            '#0066cc', '#44aa44', '#ff9944', '#ff4444',
            '#9944ff', '#44cccc', '#ff44cc', '#cccc44',
        ];
        
        return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
    }
}

export const reportEngine = new ReportEngine();

