/**
 * Secure API Client
 * Centralized API client with authentication, CSRF, rate limiting, and error handling
 */

import { protectedFetch, getAuthHeader } from './authService';
import { addCSRFHeader, checkRateLimit } from '../utils/security';

export interface ApiError {
    message: string;
    statusCode: number;
    errors?: Record<string, string[]>;
}

export interface ApiResponse<T = any> {
    data: T;
    success: boolean;
    message?: string;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
    body?: any;
    skipAuth?: boolean;
    skipCSRF?: boolean;
    rateLimitKey?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Format API URL
 */
const formatURL = (endpoint: string): string => {
    // Remove leading slash if present
    endpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_BASE_URL}/${endpoint}`;
};

/**
 * Handle API errors
 */
const handleApiError = async (response: Response): Promise<never> => {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errors: Record<string, string[]> | undefined;
    
    try {
        const data = await response.json();
        errorMessage = data.message || errorMessage;
        errors = data.errors;
    } catch {
        // Response body is not JSON
    }
    
    const error: ApiError = {
        message: errorMessage,
        statusCode: response.status,
        errors
    };
    
    console.error('❌ API Error:', error);
    
    throw error;
};

/**
 * Make secure API request
 */
export const apiRequest = async <T = any>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<ApiResponse<T>> => {
    const {
        body,
        skipAuth = false,
        skipCSRF = false,
        rateLimitKey,
        ...fetchOptions
    } = options;
    
    // Check rate limit
    if (rateLimitKey) {
        const rateLimit = checkRateLimit(rateLimitKey);
        if (!rateLimit.allowed) {
            throw new Error(
                `Rate limit exceeded. Try again in ${Math.ceil(
                    (rateLimit.resetAt - Date.now()) / 1000
                )} seconds.`
            );
        }
    }
    
    // Build headers
    let headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...fetchOptions.headers
    };
    
    // Add authentication header
    if (!skipAuth) {
        headers = {
            ...headers,
            ...getAuthHeader()
        };
    }
    
    // Add CSRF token for non-GET requests
    const method = (fetchOptions.method || 'GET').toUpperCase();
    if (!skipCSRF && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        headers = addCSRFHeader(headers);
    }
    
    // Build request options
    const requestOptions: RequestInit = {
        ...fetchOptions,
        headers,
        body: body ? JSON.stringify(body) : undefined
    };
    
    try {
        // Use protected fetch if not skipping auth
        const response = skipAuth
            ? await fetch(formatURL(endpoint), requestOptions)
            : await protectedFetch(formatURL(endpoint), requestOptions);
        
        // Handle error responses
        if (!response.ok) {
            await handleApiError(response);
        }
        
        // Parse response
        const data = await response.json();
        
        return {
            data: data.data || data,
            success: true,
            message: data.message
        };
    } catch (error) {
        // Re-throw ApiError as-is
        if ((error as ApiError).statusCode) {
            throw error;
        }
        
        // Wrap other errors
        throw {
            message: error instanceof Error ? error.message : 'Network error',
            statusCode: 0
        } as ApiError;
    }
};

/**
 * GET request
 */
export const get = <T = any>(
    endpoint: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, { ...options, method: 'GET' });
};

/**
 * POST request
 */
export const post = <T = any>(
    endpoint: string,
    body: any,
    options: Omit<RequestOptions, 'method'> = {}
): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, { ...options, method: 'POST', body });
};

/**
 * PUT request
 */
export const put = <T = any>(
    endpoint: string,
    body: any,
    options: Omit<RequestOptions, 'method'> = {}
): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, { ...options, method: 'PUT', body });
};

/**
 * PATCH request
 */
export const patch = <T = any>(
    endpoint: string,
    body: any,
    options: Omit<RequestOptions, 'method'> = {}
): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, { ...options, method: 'PATCH', body });
};

/**
 * DELETE request
 */
export const del = <T = any>(
    endpoint: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
};

/**
 * Upload file
 */
export const uploadFile = async (
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    additionalData: Record<string, any> = {}
): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    // Add additional fields
    Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
    });
    
    // Build headers (don't set Content-Type, let browser set it with boundary)
    let headers: HeadersInit = {
        ...getAuthHeader()
    };
    
    // Add CSRF token
    headers = addCSRFHeader(headers);
    
    try {
        const response = await protectedFetch(formatURL(endpoint), {
            method: 'POST',
            headers,
            body: formData
        });
        
        if (!response.ok) {
            await handleApiError(response);
        }
        
        const data = await response.json();
        
        return {
            data: data.data || data,
            success: true,
            message: data.message
        };
    } catch (error) {
        if ((error as ApiError).statusCode) {
            throw error;
        }
        
        throw {
            message: error instanceof Error ? error.message : 'Upload failed',
            statusCode: 0
        } as ApiError;
    }
};

/**
 * Download file
 */
export const downloadFile = async (
    endpoint: string,
    filename?: string
): Promise<void> => {
    try {
        const headers = getAuthHeader();
        
        const response = await protectedFetch(formatURL(endpoint), {
            method: 'GET',
            headers
        });
        
        if (!response.ok) {
            await handleApiError(response);
        }
        
        // Get filename from Content-Disposition header if not provided
        if (!filename) {
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match) {
                    filename = match[1];
                }
            }
        }
        
        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        if ((error as ApiError).statusCode) {
            throw error;
        }
        
        throw {
            message: error instanceof Error ? error.message : 'Download failed',
            statusCode: 0
        } as ApiError;
    }
};

/**
 * Batch requests
 */
export const batch = async <T = any>(
    requests: Array<{ endpoint: string; options?: RequestOptions }>
): Promise<Array<ApiResponse<T>>> => {
    return Promise.all(
        requests.map(({ endpoint, options }) => apiRequest<T>(endpoint, options))
    );
};

/**
 * API Client singleton
 */
export const apiClient = {
    get,
    post,
    put,
    patch,
    delete: del,
    upload: uploadFile,
    download: downloadFile,
    batch,
    request: apiRequest
};

export default apiClient;

