/**
 * Security Utilities
 * CSRF protection, security headers, input sanitization
 */

/**
 * Generate CSRF token
 */
export const generateCSRFToken = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Store CSRF token in session storage
 */
export const storeCSRFToken = (token: string): void => {
    sessionStorage.setItem('csrf_token', token);
};

/**
 * Get CSRF token from session storage
 */
export const getCSRFToken = (): string | null => {
    return sessionStorage.getItem('csrf_token');
};

/**
 * Validate CSRF token
 */
export const validateCSRFToken = (token: string): boolean => {
    const storedToken = getCSRFToken();
    return storedToken === token && token.length === 64;
};

/**
 * Initialize CSRF protection
 */
export const initCSRFProtection = (): string => {
    let token = getCSRFToken();
    
    if (!token) {
        token = generateCSRFToken();
        storeCSRFToken(token);
    }
    
    console.log('🔒 CSRF protection initialized');
    return token;
};

/**
 * Add CSRF token to request headers
 */
export const addCSRFHeader = (headers: HeadersInit = {}): HeadersInit => {
    const token = getCSRFToken();
    
    if (token) {
        return {
            ...headers,
            'X-CSRF-Token': token
        };
    }
    
    return headers;
};

/**
 * Security Headers Configuration
 */
export const securityHeaders = {
    // Content Security Policy
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://esm.sh https://aistudiocdn.com",
        "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://esm.sh https://aistudiocdn.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ].join('; '),
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // XSS Protection
    'X-XSS-Protection': '1; mode=block',
    
    // Frame Options
    'X-Frame-Options': 'DENY',
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy
    'Permissions-Policy': 'geolocation=(self), camera=(self), microphone=()'
};

/**
 * Apply security headers to document
 */
export const applySecurityHeaders = (): void => {
    // Add meta tags for security headers that can be set via HTML
    const head = document.head;
    
    // CSP meta tag
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = securityHeaders['Content-Security-Policy'];
    head.appendChild(cspMeta);
    
    // X-Frame-Options
    const frameOptionsMeta = document.createElement('meta');
    frameOptionsMeta.httpEquiv = 'X-Frame-Options';
    frameOptionsMeta.content = securityHeaders['X-Frame-Options'];
    head.appendChild(frameOptionsMeta);
    
    // Referrer Policy
    const referrerMeta = document.createElement('meta');
    referrerMeta.name = 'referrer';
    referrerMeta.content = securityHeaders['Referrer-Policy'];
    head.appendChild(referrerMeta);
    
    console.log('🔒 Security headers applied');
};

/**
 * Sanitize HTML to prevent XSS
 */
export const sanitizeHTML = (input: string): string => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
};

/**
 * Validate and sanitize URL
 */
export const sanitizeURL = (url: string): string | null => {
    try {
        const parsed = new URL(url, window.location.origin);
        
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }
        
        return parsed.toString();
    } catch {
        return null;
    }
};

/**
 * Rate limiting store
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit
 */
export const checkRateLimit = (
    key: string,
    maxRequests: number = 100,
    windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } => {
    const now = Date.now();
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetAt) {
        // Create new record
        const resetAt = now + windowMs;
        rateLimitStore.set(key, { count: 1, resetAt });
        
        return {
            allowed: true,
            remaining: maxRequests - 1,
            resetAt
        };
    }
    
    // Update existing record
    record.count++;
    
    if (record.count > maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: record.resetAt
        };
    }
    
    return {
        allowed: true,
        remaining: maxRequests - record.count,
        resetAt: record.resetAt
    };
};

/**
 * Secure fetch wrapper with CSRF and rate limiting
 */
export const secureFetch = async (
    url: string,
    options: RequestInit = {},
    rateLimitKey?: string
): Promise<Response> => {
    // Check rate limit
    if (rateLimitKey) {
        const rateLimit = checkRateLimit(rateLimitKey);
        if (!rateLimit.allowed) {
            throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)} seconds.`);
        }
    }
    
    // Add CSRF token for non-GET requests
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        options.headers = addCSRFHeader(options.headers);
    }
    
    // Add security headers
    options.headers = {
        ...options.headers,
        'X-Requested-With': 'XMLHttpRequest'
    };
    
    // Validate URL
    const sanitizedURL = sanitizeURL(url);
    if (!sanitizedURL) {
        throw new Error('Invalid URL');
    }
    
    return fetch(sanitizedURL, options);
};

/**
 * Password strength validator
 */
export const validatePasswordStrength = (password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
} => {
    const feedback: string[] = [];
    let score = 0;
    
    // Length check
    if (password.length >= 8) {
        score++;
    } else {
        feedback.push('Password must be at least 8 characters');
    }
    
    if (password.length >= 12) {
        score++;
    }
    
    // Complexity checks
    if (/[a-z]/.test(password)) {
        score++;
    } else {
        feedback.push('Include lowercase letters');
    }
    
    if (/[A-Z]/.test(password)) {
        score++;
    } else {
        feedback.push('Include uppercase letters');
    }
    
    if (/[0-9]/.test(password)) {
        score++;
    } else {
        feedback.push('Include numbers');
    }
    
    if (/[^a-zA-Z0-9]/.test(password)) {
        score++;
    } else {
        feedback.push('Include special characters');
    }
    
    // Common password check
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
        score = 0;
        feedback.push('Password is too common');
    }
    
    return {
        isValid: score >= 4,
        score: Math.min(score, 5),
        feedback
    };
};

/**
 * Secure session management
 */
export const initSecureSession = (): void => {
    // Set session timeout (30 minutes)
    const sessionTimeout = 30 * 60 * 1000;
    let lastActivity = Date.now();
    
    const checkSession = () => {
        const now = Date.now();
        if (now - lastActivity > sessionTimeout) {
            console.warn('🔒 Session expired');
            sessionStorage.clear();
            window.location.href = '/';
        }
    };
    
    // Update activity timestamp on user interaction
    const updateActivity = () => {
        lastActivity = Date.now();
    };
    
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, updateActivity, { passive: true });
    });
    
    // Check session every minute
    setInterval(checkSession, 60000);
    
    console.log('🔒 Secure session management initialized');
};

/**
 * Initialize all security features
 */
export const initSecurity = (): void => {
    // Initialize CSRF protection
    initCSRFProtection();
    
    // Apply security headers
    applySecurityHeaders();
    
    // Initialize secure session
    initSecureSession();
    
    console.log('🔒 Security features initialized');
};

