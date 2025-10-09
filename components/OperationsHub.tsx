import React, { useState } from 'react';
import type { User } from '../types/index';
import { users } from '../services/api';
import '../hub-styles.css';

interface OperationsHubProps {
  currentUser: User;
  onNavigate: (view: string, params?: any) => void;
  onUserChange: (user: User) => void;
}

const site = {
  title: "Operations Hub",
  tagline: "Open your tools. Get work done.",
  quickActions: [
    { label: "Open MRF", icon: "clipboard-list", view: "wo-materials" },
    { label: "Create MRF", icon: "plus-square", view: "material-requests" },
    { label: "Admin", icon: "settings", view: "control-panel" },
    { label: "Status", icon: "activity", view: "exception-dashboard" }
  ],
  apps: [
    { id: "mrf", name: "MRF App", tagline: "Request, pick, track. Fast.", view: "wo-materials", status: "live", icon: "clipboard-list", accent: "teal" },
    { id: "placeholders", name: "Placeholders", tagline: "Shared fields and templates.", view: "material-requests", status: "beta", icon: "brackets", accent: "slate" },
    { id: "toll", name: "Toll Task Request", tagline: "Delivery and collection tasks.", view: "picklist", status: "live", icon: "truck", accent: "amber" },
    { id: "tetra", name: "Tetra Radio Request", tagline: "Issue and track radios.", view: "picking", status: "beta", icon: "radio", accent: "violet" },
    { id: "fm", name: "Facility Maintenance", tagline: "Raise and monitor work orders.", view: "ac-scope-command", status: "planned", icon: "wrench", accent: "blue" },
    { id: "coates", name: "Coates Tooling", tagline: "Hire and return tooling.", view: "control-panel", status: "planned", icon: "tool", accent: "orange" },
    { id: "contacts", name: "Contacts", tagline: "People and vendors directory.", view: "exception-dashboard", status: "live", icon: "address-book", accent: "green" }
  ]
};

const hubUsers = [
  { id: "requestor", role: "Requestor" },
  { id: "ac", role: "Area Coordinator" },
  { id: "qube", role: "Qube User" },
  { id: "mc", role: "Material Coordinator" }
];

const icons = {
  "clipboard-list": "M9 12h6m-3-3v6m9-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  "plus-square": "M9 12h6m-3-3v6m9-6a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.94.572 2.153.098 2.572-1.065Z",
  activity: "M4.5 19.5l4.5-15 6 12 3-6 1.5 3",
  truck: "M2.25 15V5.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 .75.75V15m0 0H18m-5.25 0H6.75M18 15h1.003a.75.75 0 0 0 .641-.364l.641-1.068a.75.75 0 0 0 .099-.372V10.5a.75.75 0 0 0-.75-.75H15",
  radio: "M12 18v.008h.008V18H12Zm0 0v.008h.008V18H12Zm0-12A6 6 0 0 1 6 12m12 0a6 6 0 0 1-6 6m0-12a6 6 0 0 0-6 6m12 0a6 6 0 0 0-6 6m0-12V3m0 0 3-1.5M12 3 9 1.5",
  wrench: "m15.59 14.37 5.66 5.66a1.5 1.5 0 0 1-2.12 2.12l-5.66-5.66m2.12-7.78a3.75 3.75 0 1 1-5.3-5.3l3 3 3-3a3.75 3.75 0 0 1-.7 5.3Z",
  tool: "M14.74 9.34a4.25 4.25 0 0 0-5.09 5.34l-4.31 4.32a1.5 1.5 0 1 0 2.12 2.12l4.32-4.31a4.25 4.25 0 0 0 5.34-5.09l3.84-3.84a2.12 2.12 0 1 0-3-3l-3.84 3.84Z",
  "address-book": "M5.25 4.5h10.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H5.25m0-15a.75.75 0 0 0-.75.75v13.5a.75.75 0 0 0 .75.75m0-15H4.5m0 0V6m0-1.5H3m1.5 0V3m5.25 4.5h1.5M9 9.75h3m-5.25 3h7.5a2.25 2.25 0 0 1 2.25 2.25V18",
  brackets: "M8.25 6.75 5.25 12l3 5.25M15.75 6.75 18.75 12l-3 5.25"
};

const statusLabels = {
  live: "Live",
  beta: "Beta", 
  planned: "Planned"
};

const accentClasses = {
  teal: "accent-teal",
  slate: "accent-slate", 
  amber: "accent-amber",
  violet: "accent-violet",
  blue: "accent-blue",
  orange: "accent-orange",
  green: "accent-green"
};

const getIcon = (icon: string) => {
  const path = icons[icon as keyof typeof icons] || icons["activity"];
  return React.createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24",
    'aria-hidden': "true"
  }, React.createElement('path', { d: path }));
};

export const OperationsHub: React.FC<OperationsHubProps> = ({ currentUser, onNavigate, onUserChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof hubUsers[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleQuickAction = (action: typeof site.quickActions[0]) => {
    if (action.label === "Open MRF") {
      setShowModal(true);
      setSelectedUser(null);
    } else {
      onNavigate(action.view);
    }
  };

  const handleAppClick = (app: typeof site.apps[0]) => {
    if (app.id === "mrf") {
      setShowModal(true);
      setSelectedUser(null);
    } else {
      onNavigate(app.view);
    }
  };

  const handleModalContinue = () => {
    if (!selectedUser) return;
    
    // Map hub user to actual User object from API
    const actualUser = users[selectedUser.id as keyof typeof users];
    if (!actualUser) {
      console.error("User not found:", selectedUser.id);
      return;
    }
    
    // Save to localStorage
    try {
      localStorage.setItem("mrf_session_user", JSON.stringify(selectedUser));
    } catch (error) {
      console.warn("Unable to persist user", error);
    }
    
    setShowModal(false);
    onUserChange(actualUser);
    onNavigate("wo-materials");
  };

  const filteredUsers = hubUsers.filter(user =>
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return React.createElement('div', { className: "operations-hub" },
    // Hero Section
    React.createElement('section', { className: "hero-section" },
      React.createElement('div', { className: "hero-content" },
        React.createElement('p', { className: "eyebrow" }, "Operations suite"),
        React.createElement('h1', { className: "hero-title" }, site.title),
        React.createElement('p', { className: "hero-tagline" }, site.tagline),
        React.createElement('div', { className: "hero-actions" },
          React.createElement('button', {
            className: "cta-button",
            onClick: () => setShowModal(true)
          },
            React.createElement('span', { className: "cta-icon" }, getIcon("clipboard-list")),
            "Open MRF"
          ),
          React.createElement('a', { 
            className: "hero-link",
            href: "#quick-actions"
          }, "Browse tools")
        )
      )
    ),

    // Quick Actions
    React.createElement('section', { id: "quick-actions", className: "quick-actions-section" },
      React.createElement('h2', { className: "section-title" }, "Quick actions"),
      React.createElement('div', { className: "quick-actions-grid" },
        site.quickActions.map((action, index) =>
          React.createElement('button', {
            key: index,
            className: "quick-action-button",
            onClick: () => handleQuickAction(action)
          },
            React.createElement('span', { className: "quick-action-icon" }, getIcon(action.icon)),
            action.label
          )
        )
      )
    ),

    // Apps Grid
    React.createElement('section', { className: "apps-section" },
      React.createElement('div', { className: "section-header" },
        React.createElement('h2', { className: "section-title" }, "Applications"),
        React.createElement('p', { className: "section-subtitle" }, "Launch the app you need. Status updates are shown live.")
      ),
      React.createElement('div', { className: "apps-grid" },
        site.apps.map((app) =>
          React.createElement('article', {
            key: app.id,
            className: `app-card ${accentClasses[app.accent as keyof typeof accentClasses] || ''}`
          },
            React.createElement('div', { className: "app-header" },
              React.createElement('div', { className: "app-icon" }, getIcon(app.icon)),
              React.createElement('div', { className: "app-titles" },
                React.createElement('h3', { className: "app-name" }, app.name),
                React.createElement('p', { className: "app-tagline" }, app.tagline)
              ),
              React.createElement('span', { className: `status-pill ${app.status}` }, statusLabels[app.status as keyof typeof statusLabels])
            ),
            React.createElement('div', { className: "app-footer" },
              React.createElement('div', { className: "app-actions" },
                React.createElement('button', {
                  className: "btn-primary",
                  onClick: () => handleAppClick(app)
                }, "Open")
              )
            )
          )
        )
      )
    ),

    // MRF User Selection Modal
    showModal && React.createElement('div', { 
      className: "modal-overlay",
      onClick: (e) => e.target === e.currentTarget && setShowModal(false)
    },
      React.createElement('div', { className: "modal-panel" },
        React.createElement('header', { className: "modal-header" },
          React.createElement('h2', null, "Select user"),
          React.createElement('p', { className: "modal-subtitle" }, "Choose your user context for the MRF app.")
        ),
        React.createElement('div', { className: "modal-body" },
          React.createElement('div', { className: "modal-search" },
            React.createElement('input', {
              type: "search",
              placeholder: "Search users…",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value)
            })
          ),
          React.createElement('ul', { className: "user-list" },
            filteredUsers.map((user) =>
              React.createElement('li', {
                key: user.id,
                className: `user-item ${selectedUser?.id === user.id ? 'selected' : ''}`,
                onClick: () => setSelectedUser(user)
              },
                React.createElement('div', { className: "user-info" },
                  React.createElement('p', { className: "user-name" }, user.role)
                )
              )
            )
          )
        ),
        React.createElement('footer', { className: "modal-footer" },
          React.createElement('button', {
            className: "btn-secondary",
            onClick: () => setShowModal(false)
          }, "Cancel"),
          React.createElement('button', {
            className: "btn-primary",
            disabled: !selectedUser,
            onClick: handleModalContinue
          }, "Continue")
        )
      )
    )
  );
};
