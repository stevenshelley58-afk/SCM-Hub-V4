/**
 * Authentication Service
 * JWT-based authentication with token refresh and session management
 */

import { User } from '../types';

export interface AuthToken {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    token: AuthToken;
}

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'current_user';

/**
 * Mock JWT token generation (in production, this would be done by backend)
 */
const generateMockJWT = (user: User, expiresInMinutes: number = 60): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
        sub: user.name,
        role: user.role,
        permissions: user.permissions,
        iat: Date.now(),
        exp: Date.now() + (expiresInMinutes * 60 * 1000)
    }));
    const signature = btoa(`mock_signature_${user.name}_${Date.now()}`);
    
    return `${header}.${payload}.${signature}`;
};

/**
 * Parse JWT token (basic implementation)
 */
export const parseJWT = (token: string): any => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }
        
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    } catch (error) {
        console.error('Failed to parse JWT:', error);
        return null;
    }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
    const payload = parseJWT(token);
    if (!payload || !payload.exp) {
        return true;
    }
    
    return Date.now() >= payload.exp;
};

/**
 * Store authentication tokens
 */
export const storeAuthTokens = (token: AuthToken, user: User): void => {
    localStorage.setItem(TOKEN_KEY, token.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, token.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    console.log('🔑 Auth tokens stored');
};

/**
 * Get stored access token
 */
export const getAccessToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get stored refresh token
 */
export const getRefreshToken = (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) {
        return null;
    }
    
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};

/**
 * Clear authentication tokens
 */
export const clearAuthTokens = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    console.log('🔑 Auth tokens cleared');
};

/**
 * Login with credentials
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    // Mock authentication - in production, this would call backend API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock user database
    const mockUsers: Record<string, { password: string; user: User }> = {
        'requestor': {
            password: 'demo123',
            user: {
                name: 'Alex Martinez',
                role: 'Requestor',
                permissions: ['view_requests', 'create_requests', 'view_materials']
            }
        },
        'qube': {
            password: 'demo123',
            user: {
                name: 'Jordan Taylor',
                role: 'Warehouse (Qube)',
                permissions: ['view_requests', 'pick_materials', 'capture_pod', 'view_materials']
            }
        },
        'mc': {
            password: 'demo123',
            user: {
                name: 'Morgan Lee',
                role: 'Material Coordinator',
                permissions: ['god_mode']
            }
        },
        'ac': {
            password: 'demo123',
            user: {
                name: 'Riley Smith',
                role: 'Area Coordinator',
                permissions: ['view_requests', 'approve_p1', 'view_materials']
            }
        }
    };
    
    const userRecord = mockUsers[credentials.username.toLowerCase()];
    
    if (!userRecord || userRecord.password !== credentials.password) {
        throw new Error('Invalid username or password');
    }
    
    // Generate tokens
    const accessToken = generateMockJWT(userRecord.user, 60); // 60 minutes
    const refreshToken = generateMockJWT(userRecord.user, 10080); // 7 days
    
    const token: AuthToken = {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + (60 * 60 * 1000)
    };
    
    storeAuthTokens(token, userRecord.user);
    
    console.log(`🔑 User authenticated: ${userRecord.user.name} (${userRecord.user.role})`);
    
    return {
        user: userRecord.user,
        token
    };
};

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
    // In production, would call backend to invalidate token
    clearAuthTokens();
    console.log('🔑 User logged out');
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (): Promise<AuthToken | null> => {
    const refreshToken = getRefreshToken();
    const currentUser = getCurrentUser();
    
    if (!refreshToken || !currentUser) {
        return null;
    }
    
    if (isTokenExpired(refreshToken)) {
        console.warn('🔑 Refresh token expired');
        clearAuthTokens();
        return null;
    }
    
    // Mock token refresh - in production, would call backend
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newAccessToken = generateMockJWT(currentUser, 60);
    const newRefreshToken = generateMockJWT(currentUser, 10080);
    
    const token: AuthToken = {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: Date.now() + (60 * 60 * 1000)
    };
    
    storeAuthTokens(token, currentUser);
    
    console.log('🔑 Access token refreshed');
    
    return token;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    const token = getAccessToken();
    const user = getCurrentUser();
    
    if (!token || !user) {
        return false;
    }
    
    // Check if token is expired
    if (isTokenExpired(token)) {
        // Try to refresh token
        refreshAccessToken().catch(() => {
            clearAuthTokens();
        });
        return false;
    }
    
    return true;
};

/**
 * Get authorization header for API requests
 */
export const getAuthHeader = (): { Authorization: string } | {} => {
    const token = getAccessToken();
    
    if (!token) {
        return {};
    }
    
    return {
        Authorization: `Bearer ${token}`
    };
};

/**
 * Verify user has required permission
 */
export const hasPermission = (permission: string): boolean => {
    const user = getCurrentUser();
    
    if (!user) {
        return false;
    }
    
    // God mode has all permissions
    if (user.permissions.includes('god_mode')) {
        return true;
    }
    
    return user.permissions.includes(permission);
};

/**
 * Verify user has required role
 */
export const hasRole = (role: string): boolean => {
    const user = getCurrentUser();
    
    if (!user) {
        return false;
    }
    
    return user.role === role;
};

/**
 * Protected fetch - automatically adds auth header and handles token refresh
 */
export const protectedFetch = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    // Check if authenticated
    if (!isAuthenticated()) {
        throw new Error('Not authenticated');
    }
    
    // Get auth header
    const authHeader = getAuthHeader();
    
    // Merge headers
    options.headers = {
        ...options.headers,
        ...authHeader
    };
    
    // Make request
    const response = await fetch(url, options);
    
    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401) {
        console.warn('🔑 Received 401, attempting token refresh');
        
        const newToken = await refreshAccessToken();
        
        if (!newToken) {
            throw new Error('Session expired, please login again');
        }
        
        // Retry request with new token
        options.headers = {
            ...options.headers,
            Authorization: `Bearer ${newToken.accessToken}`
        };
        
        return fetch(url, options);
    }
    
    return response;
};

/**
 * Setup automatic token refresh
 */
export const setupTokenRefresh = (): () => void => {
    // Check token every 5 minutes and refresh if needed
    const intervalId = setInterval(async () => {
        const token = getAccessToken();
        
        if (!token) {
            return;
        }
        
        const payload = parseJWT(token);
        
        if (!payload || !payload.exp) {
            return;
        }
        
        // Refresh if token expires in less than 10 minutes
        const expiresIn = payload.exp - Date.now();
        const tenMinutes = 10 * 60 * 1000;
        
        if (expiresIn < tenMinutes && expiresIn > 0) {
            console.log('🔑 Token expiring soon, refreshing...');
            await refreshAccessToken();
        }
    }, 5 * 60 * 1000);
    
    console.log('🔑 Automatic token refresh enabled');
    
    // Return cleanup function
    return () => {
        clearInterval(intervalId);
    };
};

/**
 * Initialize authentication service
 */
export const initAuthService = (): void => {
    // Setup automatic token refresh
    setupTokenRefresh();
    
    // Check if user is authenticated
    if (isAuthenticated()) {
        const user = getCurrentUser();
        console.log(`🔑 User session restored: ${user?.name}`);
    }
    
    console.log('🔑 Authentication service initialized');
};

