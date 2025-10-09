import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initAccessibility } from './utils/accessibility';
import { themeManager } from './utils/themeManager';
import { initSecurity } from './utils/security';
import { initAuthService } from './services/authService';
import { initMonitoring } from './services/monitoringService';

// Initialize monitoring and error tracking
initMonitoring();

// Initialize security features (CSRF, headers, session management)
initSecurity();

// Initialize authentication service (JWT, token refresh)
initAuthService();

// Initialize accessibility features
initAccessibility();

// Initialize theme manager (will apply saved theme or OS preference)
// Theme manager auto-initializes on import

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
