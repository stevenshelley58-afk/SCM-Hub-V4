import React, { useState } from 'react';
import { SystemHealthView } from './SystemHealthView';
import { AuditLogView } from './AuditLogView';
import { ReportsView } from './ReportsView';
import { P1DashboardView } from './P1DashboardView';
import { WallDisplayView } from './WallDisplayView';
import { MCGodModeView } from './MCGodModeView';
import { SystemConfigView } from './SystemConfigView';
import { FeatureTogglesView } from './FeatureTogglesView';
import { MonitoringDashboardView } from './MonitoringDashboardView';

export const AdminControlPanelView: React.FC = () => {
    const [activeSection, setActiveSection] = useState('System Health');

    const menuItems = [
        { id: 'health', label: 'System Health', icon: '❤️', component: SystemHealthView },
        { id: 'p1', label: 'P1 Dashboard', icon: '🔴', component: P1DashboardView },
        { id: 'reports', label: 'Reports', icon: '📊', component: ReportsView },
        { id: 'audit', label: 'Audit Trail', icon: '📋', component: AuditLogView },
        { id: 'godmode', label: 'MC God Mode', icon: '⚡', component: MCGodModeView },
        { id: 'config', label: 'System Config', icon: '⚙️', component: SystemConfigView },
        { id: 'features', label: 'Feature Toggles', icon: '🎚️', component: FeatureTogglesView },
        { id: 'monitoring', label: 'Monitoring', icon: '📈', component: MonitoringDashboardView },
        { id: 'wall', label: 'Wall Display', icon: '📺', component: WallDisplayView },
    ];

    const activeMenuItem = menuItems.find(item => item.label === activeSection) || menuItems[0];
    const ActiveComponent = activeMenuItem.component;

    return (
        <div className="flex h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="w-64 border-r border-gray-200 p-4 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">MC Control Panel</h2>
                <nav className="space-y-1">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.label)}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                                activeSection === item.label 
                                    ? 'bg-blue-100 text-blue-700 font-semibold' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                
                <div className="mt-8 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xs font-semibold text-blue-900 mb-1">Quick Stats</div>
                    <div className="text-xs text-blue-700 space-y-1">
                        <div>Active Requests: 15</div>
                        <div>P1 Pending: 2</div>
                        <div>System Status: ✓ Healthy</div>
                    </div>
                </div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
                <ActiveComponent />
            </div>
        </div>
    );
};
