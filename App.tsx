
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OperationsHub } from './components/OperationsHub';
import { RequestDetailPanel } from './features/material-requests/components/RequestDetailPanel';
import { WOMaterialView } from './features/wo-materials/WOMaterialView';
import { MaterialRequestView } from './features/material-requests/MaterialRequestView';
import { QubePickListView } from './features/qube-fulfillment/QubePickListView';
import { PickingView } from './features/qube-fulfillment/PickingView';
import { ACDashboardView } from './features/ac-dashboard/ACDashboardView';
import { AdminControlPanelView } from './features/admin/AdminControlPanelView';
import { ExceptionDashboardView } from './features/admin/ExceptionDashboardView';
import { users, navLinks } from './services/api';
// Fix: Corrected import path for types.
import type { User, MaterialRequest } from './types/index';

const PlaceholderView = ({ user }: { user: User }) => React.createElement('div', { className: "p-8 border-4 border-dashed border-gray-200 rounded-lg bg-white h-full flex items-center justify-center" },
    React.createElement('div', { className: "text-center" },
        React.createElement('h2', { className: "text-2xl font-bold text-gray-700" }, `${user.role} Dashboard`),
        React.createElement('p', { className: "text-gray-500 mt-2" }, `Interface for ${user.name} would be displayed here.`)
    )
);

const App = () => {
    const [currentUser, setCurrentUser] = useState<User>(users.requestor);
    const [currentView, setCurrentView] = useState('hub');
    const [viewParams, setViewParams] = useState<any>(null);
    const [detailPanel, setDetailPanel] = useState<{ isOpen: boolean; request: MaterialRequest | null }>({ isOpen: false, request: null });

    useEffect(() => {
        // Only set default view if not on hub
        if (currentView !== 'hub') {
            const defaultView = navLinks[currentUser.id]?.[0]?.view || 'dashboard';
            setCurrentView(defaultView);
        }
    }, [currentUser, currentView]);

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
            component: () => React.createElement(QubePickListView, { openDetailPanel, navigate })
        },
        'picking': {
            title: 'Picking In Progress',
            component: () => React.createElement(PickingView, { params: viewParams, navigate })
        },
        'ac-scope-command': {
            title: 'Scope Command: Welding',
            component: () => React.createElement(ACDashboardView, { openDetailPanel, navigate })
        },
        'control-panel': {
            title: 'Control Panel',
            component: () => React.createElement(AdminControlPanelView, {})
        },
        'exception-dashboard': {
            title: 'Exception Dashboard',
            component: () => React.createElement(ExceptionDashboardView, {})
        }
    };

    const ActiveView = viewMap[currentView]?.component || (() => React.createElement(PlaceholderView, { user: currentUser }));
    const headerTitle = viewMap[currentView]?.title || 'Dashboard';

    // For hub view, don't show sidebar and header
    if (currentView === 'hub') {
        return React.createElement('div', { className: "min-h-screen bg-gray-50 font-sans" },
            React.createElement(ActiveView, null),
            React.createElement(RequestDetailPanel, { ...detailPanel, onClose: closeDetailPanel, currentUser: currentUser })
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
        React.createElement(RequestDetailPanel, { ...detailPanel, onClose: closeDetailPanel, currentUser: currentUser })
    );
};

export default App;
