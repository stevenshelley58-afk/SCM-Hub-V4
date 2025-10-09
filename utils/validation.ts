/**
 * Data Validation Utilities
 * Client-side validation with user-friendly error messages
 */

export interface ValidationRule {
    field: string;
    rules: {
        required?: boolean;
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        pattern?: RegExp;
        email?: boolean;
        phone?: boolean;
        url?: boolean;
        custom?: (value: any) => boolean | string; // Return true or error message
    };
    label: string; // User-friendly field name
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
    errorList: ValidationError[];
}

/**
 * Validate a single field
 */
export const validateField = (
    value: any,
    rules: ValidationRule['rules'],
    label: string
): string | null => {
    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
        return `${label} is required`;
    }
    
    // Skip other validations if empty and not required
    if (!rules.required && (value === undefined || value === null || value === '')) {
        return null;
    }
    
    const stringValue = String(value);
    
    // Min length
    if (rules.minLength && stringValue.length < rules.minLength) {
        return `${label} must be at least ${rules.minLength} characters`;
    }
    
    // Max length
    if (rules.maxLength && stringValue.length > rules.maxLength) {
        return `${label} must not exceed ${rules.maxLength} characters`;
    }
    
    // Min value (for numbers)
    if (rules.min !== undefined && Number(value) < rules.min) {
        return `${label} must be at least ${rules.min}`;
    }
    
    // Max value (for numbers)
    if (rules.max !== undefined && Number(value) > rules.max) {
        return `${label} must not exceed ${rules.max}`;
    }
    
    // Pattern matching
    if (rules.pattern && !rules.pattern.test(stringValue)) {
        return `${label} format is invalid`;
    }
    
    // Email validation
    if (rules.email && !isValidEmail(stringValue)) {
        return `${label} must be a valid email address`;
    }
    
    // Phone validation
    if (rules.phone && !isValidPhone(stringValue)) {
        return `${label} must be a valid phone number`;
    }
    
    // URL validation
    if (rules.url && !isValidURL(stringValue)) {
        return `${label} must be a valid URL`;
    }
    
    // Custom validation
    if (rules.custom) {
        const result = rules.custom(value);
        if (result !== true) {
            return typeof result === 'string' ? result : `${label} is invalid`;
        }
    }
    
    return null;
};

/**
 * Validate an entire form
 */
export const validateForm = (
    data: Record<string, any>,
    rules: ValidationRule[]
): ValidationResult => {
    const errors: Record<string, string> = {};
    const errorList: ValidationError[] = [];
    
    for (const rule of rules) {
        const value = data[rule.field];
        const error = validateField(value, rule.rules, rule.label);
        
        if (error) {
            errors[rule.field] = error;
            errorList.push({ field: rule.field, message: error });
        }
    }
    
    return {
        isValid: errorList.length === 0,
        errors,
        errorList
    };
};

/**
 * Email validation
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Phone validation (flexible format)
 */
export const isValidPhone = (phone: string): boolean => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Valid if 10-15 digits
    return digits.length >= 10 && digits.length <= 15;
};

/**
 * URL validation
 */
export const isValidURL = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    if (digits.length === 11 && digits[0] === '1') {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return phone;
};

/**
 * Sanitize input (prevent XSS)
 */
export const sanitizeInput = (input: string): string => {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

/**
 * Validate file upload
 */
export const validateFile = (
    file: File,
    options: {
        maxSize?: number; // in bytes
        allowedTypes?: string[];
        allowedExtensions?: string[];
    }
): string | null => {
    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
        const sizeMB = (options.maxSize / (1024 * 1024)).toFixed(1);
        return `File size must not exceed ${sizeMB} MB`;
    }
    
    // Check MIME type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
        return `File type ${file.type} is not allowed`;
    }
    
    // Check extension
    if (options.allowedExtensions) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !options.allowedExtensions.includes(extension)) {
            return `File extension .${extension} is not allowed`;
        }
    }
    
    return null;
};

/**
 * Real-time validation with debouncing
 */
export const createFieldValidator = (
    rules: ValidationRule['rules'],
    label: string,
    debounceMs: number = 300
) => {
    let timeout: NodeJS.Timeout | null = null;
    
    return (value: any, callback: (error: string | null) => void) => {
        if (timeout) clearTimeout(timeout);
        
        timeout = setTimeout(() => {
            const error = validateField(value, rules, label);
            callback(error);
        }, debounceMs);
    };
};

/**
 * Common validation rules
 */
export const commonRules = {
    email: {
        email: true,
        required: true
    },
    
    phone: {
        phone: true,
        required: true
    },
    
    password: {
        required: true,
        minLength: 8,
        custom: (value: string) => {
            if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter';
            if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter';
            if (!/[0-9]/.test(value)) return 'Password must contain a number';
            return true;
        }
    },
    
    username: {
        required: true,
        minLength: 3,
        maxLength: 20,
        pattern: /^[a-zA-Z0-9_-]+$/
    },
    
    postalCode: {
        required: true,
        pattern: /^\d{5}(-\d{4})?$/
    },
    
    quantity: {
        required: true,
        min: 1,
        custom: (value: any) => {
            return Number.isInteger(Number(value)) || 'Must be a whole number';
        }
    },
    
    price: {
        required: true,
        min: 0,
        custom: (value: any) => {
            const num = Number(value);
            return !isNaN(num) && num >= 0 || 'Must be a valid price';
        }
    }
};

/**
 * Format validation errors for display
 */
export const formatErrors = (errors: ValidationError[]): string => {
    if (errors.length === 0) return '';
    
    if (errors.length === 1) {
        return errors[0].message;
    }
    
    return `${errors.length} errors:\n${errors.map(e => `• ${e.message}`).join('\n')}`;
};

/**
 * Validate Material Request specific fields
 */
export const validateMaterialRequest = (data: {
    deliveryLocation?: string;
    recipientName?: string;
    contactNumber?: string;
    priority?: string;
}): ValidationResult => {
    const rules: ValidationRule[] = [
        {
            field: 'deliveryLocation',
            rules: { required: true },
            label: 'Delivery Location'
        },
        {
            field: 'recipientName',
            rules: { required: true, minLength: 2 },
            label: 'Recipient Name'
        },
        {
            field: 'contactNumber',
            rules: { required: true, phone: true },
            label: 'Contact Number'
        },
        {
            field: 'priority',
            rules: { required: true },
            label: 'Priority'
        }
    ];
    
    return validateForm(data, rules);
};

/**
 * Show validation error in UI
 */
export const showFieldError = (fieldId: string, message: string | null) => {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove existing error
    const existingError = document.getElementById(`${fieldId}-error`);
    if (existingError) existingError.remove();
    
    if (message) {
        // Add error styling
        field.classList.add('border-red-500');
        field.classList.add('focus:ring-red-300');
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.id = `${fieldId}-error`;
        errorDiv.className = 'text-sm text-red-600 mt-1';
        errorDiv.textContent = message;
        field.parentElement?.appendChild(errorDiv);
    } else {
        // Remove error styling
        field.classList.remove('border-red-500');
        field.classList.remove('focus:ring-red-300');
    }
};

/**
 * Clear all validation errors
 */
export const clearAllErrors = (fieldIds: string[]) => {
    fieldIds.forEach(id => showFieldError(id, null));
};

