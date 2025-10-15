
import React, { useState, useEffect } from 'react';
import './hub-styles.css';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OperationsHub } from './components/OperationsHub';
import { RequestDetailPanel } from './features/material-requests/components/RequestDetailPanel';
import { WOMaterialView } from './features/wo-materials/WOMaterialView';
import { MaterialRequestView } from './features/material-requests/MaterialRequestView';
import { QubePickListView } from './features/qube-fulfillment/QubePickListView';
import { PickingView } from './features/qube-fulfillment/PickingView';
import { OnHoldView } from './features/qube-fulfillment/OnHoldView';
import { ACDashboardView } from './features/ac-dashboard/ACDashboardView';
import { AdminControlPanelView } from './features/admin/AdminControlPanelView';
import { ExceptionDashboardView } from './features/admin/ExceptionDashboardView';
import { IntegrationsView } from './features/integrations/IntegrationsView';
import { P1ApprovalView } from './features/admin/P1ApprovalView';
import { PriorityQueueView } from './features/admin/PriorityQueueView';
import { WorkflowDiagramView } from './features/admin/WorkflowDiagramView';
import { LocationManagementView } from './features/admin/LocationManagementView';
import { KeyboardShortcutsModal } from './components/ui/KeyboardShortcutsModal';
import { LogisticsDispatcherView } from './features/logistics/LogisticsDispatcherView';
import { LogisticsDriverView } from './features/logistics/LogisticsDriverView';
import { LogisticsConfigView } from './features/logistics/LogisticsConfigView';
import { LTRRequestView } from './features/logistics/LTRRequestView';
import { LTRMyRequestsView } from './features/logistics/LTRMyRequestsView';
import { LogisticsReportsView } from './features/logistics/LogisticsReportsView';
import { users, navLinks } from './services/api';
// Fix: Corrected import path for types.
import type { User, MaterialRequest } from './types/index';
import { initDefaultShortcuts } from './utils/keyboardShortcuts';

const PlaceholderView = ({ user }: { user: User }) => React.createElement('div', { className: "p-8 border-4 border-dashed border-gray-200 rounded-lg bg-white h-full flex items-center justify-center" },
    React.createElement('div', { className: "text-center" },
        React.createElement('h2', { className: "text-2xl font-bold text-gray-700" }, `${user.role} Dashboard`),
        React.createElement('p', { className: "text-gray-500 mt-2" }, `Interface for ${user.name} would be displayed here.`)
    )
);

const App = () => {
    const [currentUser, setCurrentUser] = useState<User>(users.requestor_mrf);
    const [currentView, setCurrentView] = useState('hub');
    const [viewParams, setViewParams] = useState<any>(null);
    const [detailPanel, setDetailPanel] = useState<{ isOpen: boolean; request: MaterialRequest | null }>({ isOpen: false, request: null });
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);

    // Initialize keyboard shortcuts
    useEffect(() => {
        initDefaultShortcuts({
            onQuickSearch: () => {
                // Focus on search input if available, or navigate to material requests view
                const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                    setSearchFocused(true);
                } else {
                    // If no search input, go to material requests view which has search
                    setCurrentView('material-requests');
                }
            },
            onNewRequest: () => {
                // Navigate to WO Materials view to create new request
                if (currentUser.id === 'requestor_mrf' || currentUser.id === 'ac') {
                    setCurrentView('wo-materials');
                }
            },
            onShowHelp: () => {
                setShowShortcutsHelp(true);
            }
        });
    }, [currentUser]);

    // When user changes, reset to their first nav link (unless on hub)
    useEffect(() => {
        if (currentView !== 'hub') {
            const normalizedId = currentUser.id === 'requestor' ? 'requestor_mrf' : currentUser.id;
            const defaultView = navLinks[normalizedId]?.[0]?.view || 'dashboard';
            setCurrentView(defaultView);
        }
    }, [currentUser.id]);

    const handleUserChange = (user: User) => {
        setCurrentUser(user);
    };

    const navigate = (view: string, params: any = null) => {
        setCurrentView(view);
        setViewParams(params);
    };

    const openDetailPanel = (request: MaterialRequest) => setDetailPanel({ isOpen: true, request });
    const closeDetailPanel = () => setDetailPanel({ isOpen: false, request: null });

    const viewMap: { [key: string]: { title: string; component: React.ComponentType<any> } } = {
        'hub': {
            title: 'Operations Hub',
            component: () => React.createElement(OperationsHub, { currentUser, onNavigate: navigate, onUserChange: handleUserChange })
        },
        'wo-materials': {
            title: 'Work Order Materials',
            component: () => React.createElement(WOMaterialView, { openDetailPanel, currentUser, navigate })
        },
        'material-requests': {
            title: 'Material Requests',
            component: () => React.createElement(MaterialRequestView, { openDetailPanel, navigate })
        },
        'picklist': {
            title: 'Warehouse Pick List',
            component: () => React.createElement(QubePickListView, { openDetailPanel, navigate, currentUser })
        },
        'onhold': {
            title: 'On Hold Requests',
            component: () => React.createElement(OnHoldView, { navigate })
        },
        'picking': {
            title: 'Picking In Progress',
            component: () => React.createElement(PickingView, { params: viewParams, navigate })
        },
        'ac-scope-command': {
            title: 'Scope Command: Welding',
            component: () => React.createElement(ACDashboardView, { openDetailPanel, navigate })
        },
        'p1-approval': {
            title: 'P1 Approval Queue',
            component: () => React.createElement(P1ApprovalView, { navigate })
        },
        'priority-queue': {
            title: 'Priority Queue Management',
            component: () => React.createElement(PriorityQueueView, { navigate, currentUser })
        },
        'workflow-diagram': {
            title: 'Workflow Diagram',
            component: () => React.createElement(WorkflowDiagramView, {})
        },
        'location-management': {
            title: 'Delivery Locations',
            component: () => React.createElement(LocationManagementView, { navigate })
        },
        'control-panel': {
            title: 'Control Panel',
            component: () => React.createElement(AdminControlPanelView, {})
        },
        'exception-dashboard': {
            title: 'Partial Picks Dashboard',
            component: () => React.createElement(ExceptionDashboardView, {})
        },
        'integrations': {
            title: 'Integrations & Notifications',
            component: () => React.createElement(IntegrationsView, {})
        },
        'logistics-dispatcher': {
            title: 'Logistics Dispatcher',
            component: () => React.createElement(LogisticsDispatcherView, {})
        },
        'logistics-driver': {
            title: 'Driver Tasks',
            component: () => React.createElement(LogisticsDriverView, { driverId: 'demo-driver-1' })
        },
        'logistics-config': {
            title: 'Logistics Configuration',
            component: () => React.createElement(LogisticsConfigView, {})
        },
        'logistics-reports': {
            title: 'Reports & Analytics',
            component: () => React.createElement(LogisticsReportsView, {})
        }
        ,
        'ltr-request': {
            title: 'Logistics Task Router – New Task',
            component: () => React.createElement(LTRRequestView, { currentUser })
        },
        'ltr-my-requests': {
            title: 'Logistics Task Router – My Requests',
            component: () => React.createElement(LTRMyRequestsView, { currentUser })
        }
    };

    const ActiveView = viewMap[currentView]?.component || (() => React.createElement(PlaceholderView, { user: currentUser }));
    const headerTitle = viewMap[currentView]?.title || 'Dashboard';

    // For hub view, don't show sidebar and header
    if (currentView === 'hub') {
        return React.createElement('div', { className: "min-h-screen bg-gray-50 font-sans" },
            React.createElement(ActiveView, null),
            React.createElement(RequestDetailPanel, { ...detailPanel, onClose: closeDetailPanel, currentUser: currentUser }),
            React.createElement(KeyboardShortcutsModal, { isOpen: showShortcutsHelp, onClose: () => setShowShortcutsHelp(false) })
        );
    }

    return React.createElement('div', { className: "flex h-screen bg-gray-50 font-sans" },
        React.createElement(Sidebar, { currentUser: currentUser, onUserChange: handleUserChange, currentView, onNavigate: navigate, navLinks }),
        React.createElement('div', { className: "flex-1 flex flex-col overflow-hidden" },
            React.createElement(Header, { title: headerTitle, user: currentUser, currentView: currentView }),
            React.createElement('main', { className: "flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6" },
                React.createElement(ActiveView, null)
            )
        ),
        React.createElement(RequestDetailPanel, { ...detailPanel, onClose: closeDetailPanel, currentUser: currentUser }),
        React.createElement(KeyboardShortcutsModal, { isOpen: showShortcutsHelp, onClose: () => setShowShortcutsHelp(false) })
    );
};

export default App;
