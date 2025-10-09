// Session Management Service
// Handles session timeout, auto-save, and session recovery

export interface Session {
    id: string;
    userId: string;
    startedAt: string;
    lastActivity: string;
    expiresAt: string;
    isActive: boolean;
    data: Record<string, any>;
}

export interface DraftData {
    id: string;
    type: 'material_request' | 'wo_selection' | 'form';
    data: any;
    savedAt: string;
    expiresAt: string;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const DRAFT_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const AUTO_SAVE_INTERVAL = 30 * 1000; // 30 seconds

let currentSession: Session | null = null;
let drafts: DraftData[] = [];
let autoSaveTimer: NodeJS.Timeout | null = null;
let sessionCheckTimer: NodeJS.Timeout | null = null;

// Create new session
export const createSession = (userId: string): Session => {
    const now = new Date();
    const session: Session = {
        id: `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        startedAt: now.toISOString(),
        lastActivity: now.toISOString(),
        expiresAt: new Date(now.getTime() + SESSION_TIMEOUT).toISOString(),
        isActive: true,
        data: {}
    };

    currentSession = session;
    startSessionMonitoring();
    return session;
};

// Get current session
export const getCurrentSession = (): Session | null => {
    return currentSession;
};

// Update session activity
export const updateSessionActivity = (): void => {
    if (!currentSession) return;

    const now = new Date();
    currentSession.lastActivity = now.toISOString();
    currentSession.expiresAt = new Date(now.getTime() + SESSION_TIMEOUT).toISOString();
};

// End session
export const endSession = (): void => {
    if (currentSession) {
        currentSession.isActive = false;
    }
    currentSession = null;
    stopAutoSave();
    stopSessionMonitoring();
};

// Check if session is expired
export const isSessionExpired = (): boolean => {
    if (!currentSession) return true;
    return new Date() >= new Date(currentSession.expiresAt);
};

// Extend session
export const extendSession = (minutes: number = 30): void => {
    if (!currentSession) return;

    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
    currentSession.expiresAt = expiresAt.toISOString();
};

// Store session data
export const setSessionData = (key: string, value: any): void => {
    if (!currentSession) return;
    currentSession.data[key] = value;
};

// Get session data
export const getSessionData = (key: string): any => {
    if (!currentSession) return undefined;
    return currentSession.data[key];
};

// Save draft
export const saveDraft = (
    type: DraftData['type'],
    data: any,
    draftId?: string
): DraftData => {
    const now = new Date();
    const id = draftId || `DRAFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const existingDraftIndex = drafts.findIndex(d => d.id === id);

    const draft: DraftData = {
        id,
        type,
        data,
        savedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + DRAFT_EXPIRY).toISOString()
    };

    if (existingDraftIndex >= 0) {
        drafts[existingDraftIndex] = draft;
    } else {
        drafts.unshift(draft);
    }

    // Store in localStorage for persistence
    try {
        localStorage.setItem('scmhub_drafts', JSON.stringify(drafts));
    } catch (error) {
        console.error('Failed to save draft to localStorage:', error);
    }

    return draft;
};

// Get draft
export const getDraft = (draftId: string): DraftData | undefined => {
    return drafts.find(d => d.id === draftId);
};

// Get all drafts
export const getAllDrafts = (type?: DraftData['type']): DraftData[] => {
    cleanExpiredDrafts();
    
    if (type) {
        return drafts.filter(d => d.type === type);
    }
    return drafts;
};

// Delete draft
export const deleteDraft = (draftId: string): void => {
    drafts = drafts.filter(d => d.id !== draftId);
    
    try {
        localStorage.setItem('scmhub_drafts', JSON.stringify(drafts));
    } catch (error) {
        console.error('Failed to update localStorage:', error);
    }
};

// Clean expired drafts
const cleanExpiredDrafts = (): void => {
    const now = new Date();
    drafts = drafts.filter(d => new Date(d.expiresAt) > now);
};

// Auto-save functionality
let autoSaveCallback: (() => void) | null = null;

export const startAutoSave = (callback: () => void): void => {
    autoSaveCallback = callback;
    
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
    }

    autoSaveTimer = setInterval(() => {
        if (autoSaveCallback) {
            autoSaveCallback();
        }
    }, AUTO_SAVE_INTERVAL);
};

export const stopAutoSave = (): void => {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
        autoSaveTimer = null;
    }
    autoSaveCallback = null;
};

// Session monitoring
const startSessionMonitoring = (): void => {
    if (sessionCheckTimer) {
        clearInterval(sessionCheckTimer);
    }

    sessionCheckTimer = setInterval(() => {
        if (isSessionExpired()) {
            console.warn('Session expired');
            // Trigger session expired event
            window.dispatchEvent(new CustomEvent('session-expired'));
            endSession();
        }
    }, 60 * 1000); // Check every minute
};

const stopSessionMonitoring = (): void => {
    if (sessionCheckTimer) {
        clearInterval(sessionCheckTimer);
        sessionCheckTimer = null;
    }
};

// Recover session from storage
export const recoverSession = (): Session | null => {
    try {
        const sessionData = localStorage.getItem('scmhub_session');
        if (sessionData) {
            const session = JSON.parse(sessionData) as Session;
            if (new Date(session.expiresAt) > new Date()) {
                currentSession = session;
                startSessionMonitoring();
                return session;
            }
        }
    } catch (error) {
        console.error('Failed to recover session:', error);
    }
    return null;
};

// Save session to storage
export const persistSession = (): void => {
    if (!currentSession) return;
    
    try {
        localStorage.setItem('scmhub_session', JSON.stringify(currentSession));
    } catch (error) {
        console.error('Failed to persist session:', error);
    }
};

// Load drafts from storage
export const loadDraftsFromStorage = (): void => {
    try {
        const draftsData = localStorage.getItem('scmhub_drafts');
        if (draftsData) {
            drafts = JSON.parse(draftsData);
            cleanExpiredDrafts();
        }
    } catch (error) {
        console.error('Failed to load drafts:', error);
    }
};

// Initialize session management
export const initializeSessionManagement = (userId: string): void => {
    // Try to recover existing session
    const recovered = recoverSession();
    
    if (!recovered || recovered.userId !== userId) {
        // Create new session if recovery failed or user changed
        createSession(userId);
    }

    // Load drafts
    loadDraftsFromStorage();

    // Update activity on user interaction
    const updateActivity = () => updateSessionActivity();
    window.addEventListener('click', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('scroll', updateActivity);

    // Persist session before unload
    window.addEventListener('beforeunload', () => {
        persistSession();
    });
};

// Get session stats
export const getSessionStats = (): {
    isActive: boolean;
    duration: number; // milliseconds
    timeRemaining: number; // milliseconds
    draftCount: number;
} => {
    if (!currentSession) {
        return {
            isActive: false,
            duration: 0,
            timeRemaining: 0,
            draftCount: drafts.length
        };
    }

    const now = new Date();
    const startedAt = new Date(currentSession.startedAt);
    const expiresAt = new Date(currentSession.expiresAt);

    return {
        isActive: currentSession.isActive,
        duration: now.getTime() - startedAt.getTime(),
        timeRemaining: Math.max(0, expiresAt.getTime() - now.getTime()),
        draftCount: drafts.length
    };
};
