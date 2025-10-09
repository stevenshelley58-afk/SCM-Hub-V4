/**
 * Logistics Reports View
 * Modular, configurable reporting dashboard
 */

import React, { useState, useEffect } from 'react';
import { reportEngine } from '../../services/reporting/reportEngine';
import { siteConfigManager } from '../../config/siteConfig';
import type { KPI, ReportData } from '../../services/reporting/reportEngine';

export const LogisticsReportsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'daily' | 'driver' | 'custom'>('dashboard');
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
    const [dailySummary, setDailySummary] = useState<ReportData | null>(null);
    const [driverReport, setDriverReport] = useState<ReportData | null>(null);

    useEffect(() => {
        if (activeTab === 'dashboard') {
            loadKPIs();
        } else if (activeTab === 'daily') {
            loadDailySummary();
        } else if (activeTab === 'driver') {
            loadDriverReport();
        }
    }, [activeTab, dateRange]);

    // Auto-refresh dashboard
    useEffect(() => {
        const config = siteConfigManager.getConfig();
        const refreshInterval = config.reporting.dashboard.refresh_interval_seconds * 1000;

        const interval = setInterval(() => {
            if (activeTab === 'dashboard') {
                loadKPIs();
            }
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [activeTab]);

    const loadKPIs = async () => {
        setLoading(true);
        try {
            const range = getDateRangeForFilter(dateRange);
            const data = await reportEngine.generateKPIDashboard(range);
            setKpis(data);
        } catch (error) {
            console.error('Error loading KPIs:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDailySummary = async () => {
        setLoading(true);
        try {
            const report = await reportEngine.generateDailySummary();
            setDailySummary(report);
        } catch (error) {
            console.error('Error loading daily summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDriverReport = async () => {
        setLoading(true);
        try {
            const range = getDateRangeForFilter(dateRange);
            const report = await reportEngine.generateDriverPerformanceReport(range);
            setDriverReport(report);
        } catch (error) {
            console.error('Error loading driver report:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDateRangeForFilter = (filter: string) => {
        const now = new Date();
        let start: Date;

        switch (filter) {
            case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                start = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                start = new Date(now.setDate(now.getDate() - 30));
                break;
            default:
                start = new Date(now.setHours(0, 0, 0, 0));
        }

        return {
            start: start.toISOString(),
            end: new Date().toISOString(),
        };
    };

    const handleDownloadReport = (report: ReportData | null) => {
        if (!report) return;
        reportEngine.downloadCSV(report);
    };

    const config = siteConfigManager.getConfig();

    return (
        <div className="logistics-reports-view" style={{ padding: '20px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
            }}>
                <div>
                    <h1 style={{ margin: 0, marginBottom: '8px' }}>📊 Reports & Analytics</h1>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                        Site: {config.site_name} ({config.site_code})
                    </p>
                </div>

                {/* Date Range Filter */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>Period:</span>
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as any)}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                        }}
                    >
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
                borderBottom: '1px solid #ddd',
                paddingBottom: '0',
            }}>
                {[
                    { key: 'dashboard', label: '📊 Dashboard', enabled: true },
                    { key: 'daily', label: '📅 Daily Summary', enabled: true },
                    { key: 'driver', label: '👤 Driver Performance', enabled: true },
                    { key: 'custom', label: '📝 Custom Reports', enabled: config.features.advanced_reports },
                ].map(tab => (
                    tab.enabled && (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            style={{
                                padding: '12px 20px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                borderBottom: activeTab === tab.key ? '3px solid #0066cc' : 'none',
                                color: activeTab === tab.key ? '#0066cc' : '#666',
                                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                                cursor: 'pointer',
                                fontSize: '14px',
                            }}
                        >
                            {tab.label}
                        </button>
                    )
                ))}
            </div>

            {loading ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    color: '#888',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                    <div>Loading report data...</div>
                </div>
            ) : (
                <>
                    {/* KPI Dashboard */}
                    {activeTab === 'dashboard' && (
                        <div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '20px',
                                marginBottom: '32px',
                            }}>
                                {kpis.map(kpi => (
                                    <KPICard key={kpi.id} kpi={kpi} />
                                ))}
                            </div>

                            {kpis.length === 0 && (
                                <div style={{
                                    padding: '40px',
                                    textAlign: 'center',
                                    backgroundColor: '#f9f9f9',
                                    borderRadius: '8px',
                                    color: '#888',
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                                    <div>No KPI data available for this period</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Daily Summary */}
                    {activeTab === 'daily' && dailySummary && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '24px',
                            }}>
                                <h2 style={{ margin: 0 }}>{dailySummary.title}</h2>
                                <button
                                    onClick={() => handleDownloadReport(dailySummary)}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#0066cc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                    }}
                                >
                                    📥 Download CSV
                                </button>
                            </div>

                            {/* Summary Cards */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: '16px',
                                marginBottom: '32px',
                            }}>
                                <SummaryCard label="Total Tasks" value={dailySummary.summary.total_tasks} color="#0066cc" />
                                <SummaryCard label="Completed" value={dailySummary.summary.completed_tasks} color="#44aa44" />
                                <SummaryCard label="In Progress" value={dailySummary.summary.in_progress_tasks} color="#ff9944" />
                                <SummaryCard label="Exceptions" value={dailySummary.summary.exception_tasks} color="#ff4444" />
                                <SummaryCard label="On Hold" value={dailySummary.summary.on_hold_tasks} color="#888" />
                            </div>

                            {/* Priority Breakdown */}
                            <div style={{
                                backgroundColor: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '20px',
                            }}>
                                <h3 style={{ marginTop: 0 }}>By Priority</h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '16px',
                                }}>
                                    <PriorityCard label="Critical" count={dailySummary.summary.by_priority.critical} color="#ff4444" />
                                    <PriorityCard label="High" count={dailySummary.summary.by_priority.high} color="#ff9944" />
                                    <PriorityCard label="Normal" count={dailySummary.summary.by_priority.normal} color="#44aa44" />
                                    <PriorityCard label="Low" count={dailySummary.summary.by_priority.low} color="#888" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Driver Performance */}
                    {activeTab === 'driver' && driverReport && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '24px',
                            }}>
                                <h2 style={{ margin: 0 }}>{driverReport.title}</h2>
                                <button
                                    onClick={() => handleDownloadReport(driverReport)}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#0066cc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                    }}
                                >
                                    📥 Download CSV
                                </button>
                            </div>

                            {/* Summary */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '16px',
                                marginBottom: '24px',
                            }}>
                                <SummaryCard label="Total Drivers" value={driverReport.summary.total_drivers} color="#0066cc" />
                                <SummaryCard label="Avg Tasks/Driver" value={driverReport.summary.avg_tasks_per_driver} color="#44aa44" />
                                <SummaryCard label="Top Performer" value={driverReport.summary.top_performer} color="#ff9944" />
                            </div>

                            {/* Driver Table */}
                            <div style={{
                                backgroundColor: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                overflow: 'hidden',
                            }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Driver</th>
                                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Total Tasks</th>
                                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Completed</th>
                                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>In Progress</th>
                                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Exceptions</th>
                                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Completion Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {driverReport.data.map((driver: any) => (
                                            <tr key={driver.driver_id}>
                                                <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                                                    <strong>{driver.driver_name}</strong>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                                                    {driver.total_tasks}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                                                    {driver.completed_tasks}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                                                    {driver.in_progress_tasks}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                                                    {driver.exception_tasks}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        backgroundColor: parseFloat(driver.completion_rate) > 80 ? '#e8f5e9' : '#fff3e0',
                                                        color: parseFloat(driver.completion_rate) > 80 ? '#44aa44' : '#ff9944',
                                                        fontWeight: 'bold',
                                                    }}>
                                                        {driver.completion_rate}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Custom Reports */}
                    {activeTab === 'custom' && (
                        <div style={{
                            padding: '60px',
                            textAlign: 'center',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '8px',
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                            <h3>Custom Report Builder</h3>
                            <p style={{ color: '#666' }}>Coming soon - Build your own custom reports with drag-and-drop fields</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// KPI Card Component
const KPICard: React.FC<{ kpi: KPI }> = ({ kpi }) => (
    <div style={{
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '12px',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
    }}>
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            backgroundColor: kpi.color,
        }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>{kpi.label}</span>
            <span style={{ fontSize: '24px' }}>{kpi.icon}</span>
        </div>
        
        <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: kpi.color }}>
            {kpi.value}
        </div>
        
        {kpi.change !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <span style={{
                    color: kpi.trend === 'up' ? '#44aa44' : kpi.trend === 'down' ? '#ff4444' : '#888'
                }}>
                    {kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'}
                </span>
                <span style={{ color: '#666' }}>
                    {typeof kpi.change === 'number' ? `${kpi.change.toFixed(1)}%` : kpi.change}
                </span>
            </div>
        )}
    </div>
);

// Summary Card Component
const SummaryCard: React.FC<{ label: string; value: any; color: string }> = ({ label, value, color }) => (
    <div style={{
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        textAlign: 'center',
    }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color }}>{value}</div>
    </div>
);

// Priority Card Component
const PriorityCard: React.FC<{ label: string; count: number; color: string }> = ({ label, count, color }) => (
    <div style={{
        padding: '16px',
        backgroundColor: color + '20',
        borderRadius: '8px',
        border: `2px solid ${color}`,
        textAlign: 'center',
    }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color }}>{count}</div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{label}</div>
    </div>
);

