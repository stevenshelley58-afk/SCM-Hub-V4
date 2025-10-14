/**
 * Multi-Site Configuration System
 * Flexible, modular configuration for different site requirements
 */

export interface SiteConfig {
    site_id: string;
    site_code: string; // e.g., "QLD", "NSW", "VIC", "WA"
    site_name: string;
    enabled: boolean;
    
    // Feature Flags
    features: SiteFeatures;
    
    // Workflows
    workflows: SiteWorkflows;
    
    // SLA Rules
    sla_rules: SLARules;
    
    // Notifications
    notifications: NotificationConfig;
    
    // Reporting
    reporting: ReportingConfig;
    
    // Integrations
    integrations: IntegrationConfig;
    
    // Business Rules
    business_rules: BusinessRules;
    
    // UI Customization
    ui_config: UIConfig;
}

// ====================================
// Feature Flags
// ====================================

export interface SiteFeatures {
    // Core Features
    task_management: boolean;
    pod_capture: boolean;
    offline_mode: boolean;
    
    // Advanced Features
    auto_task_creation: boolean; // Auto-create from MRFs
    real_time_tracking: boolean; // GPS tracking
    signature_required: boolean; // Mandatory signature
    photo_mandatory: boolean; // Mandatory photos
    
    // Integration Features
    materials_integration: boolean;
    toll_ltr_integration: boolean;
    teams_integration: boolean;
    sms_notifications: boolean;
    email_notifications: boolean;
    
    // Driver Features
    driver_mobile_app: boolean;
    driver_ratings: boolean;
    driver_notes: boolean;
    
    // Reporting Features
    advanced_reports: boolean;
    custom_dashboards: boolean;
    data_export: boolean;
    scheduled_reports: boolean;
    
    // Admin Features
    multi_site_view: boolean; // Can see other sites
    bulk_operations: boolean;
    audit_logging: boolean;
}

// ====================================
// Workflows
// ====================================

export interface SiteWorkflows {
    // Task Creation Workflow
    task_creation: {
        requires_approval: boolean;
        approver_roles: string[];
        auto_assign: boolean;
        assignment_logic: 'round_robin' | 'closest_driver' | 'least_busy' | 'manual';
    };
    
    // Task Execution Workflow
    task_execution: {
        require_pickup_confirmation: boolean;
        require_dropoff_confirmation: boolean;
        allow_partial_completion: boolean;
        require_pod_verification: boolean;
    };
    
    // POD Workflow
    pod_workflow: {
        min_photos: number;
        max_photos: number;
        signature_required: boolean;
        gps_verification: boolean;
        gps_tolerance_meters: number;
        require_receiver_phone: boolean;
        require_delivery_notes: boolean;
    };
    
    // Exception Workflow
    exception_workflow: {
        auto_escalate: boolean;
        escalation_timeout_minutes: number;
        escalation_chain: string[];
        require_photos: boolean;
        require_resolution_notes: boolean;
    };
    
    // Approval Workflow
    approval_workflow: {
        high_priority_approval: boolean;
        critical_priority_approval: boolean;
        after_hours_approval: boolean;
        approver_roles: string[];
    };
}

// ====================================
// SLA Rules
// ====================================

export interface SLARules {
    enabled: boolean;
    
    // Default SLAs by Priority
    default_slas: {
        critical: number; // minutes
        high: number;
        normal: number;
        low: number;
    };
    
    // SLA by Task Type
    task_type_slas: Record<string, {
        critical: number;
        high: number;
        normal: number;
        low: number;
    }>;
    
    // Business Hours
    business_hours: {
        enabled: boolean;
        timezone: string;
        monday: { start: string; end: string } | null;
        tuesday: { start: string; end: string } | null;
        wednesday: { start: string; end: string } | null;
        thursday: { start: string; end: string } | null;
        friday: { start: string; end: string } | null;
        saturday: { start: string; end: string } | null;
        sunday: { start: string; end: string } | null;
    };
    
    // SLA Calculation
    calculation: {
        exclude_weekends: boolean;
        exclude_holidays: boolean;
        exclude_after_hours: boolean;
        buffer_minutes: number; // Extra buffer time
    };
    
    // SLA Alerts
    alerts: {
        warn_at_percentage: number; // e.g., 80% of SLA time
        breach_notification: boolean;
        escalate_on_breach: boolean;
    };
}

// ====================================
// Notifications
// ====================================

export interface NotificationConfig {
    // Email
    email: {
        enabled: boolean;
        smtp_host?: string;
        smtp_port?: number;
        from_address: string;
        from_name: string;
        templates: Record<string, EmailTemplate>;
    };
    
    // SMS
    sms: {
        enabled: boolean;
        provider: 'twilio' | 'aws_sns' | 'custom';
        api_key?: string;
        from_number?: string;
        templates: Record<string, string>;
    };
    
    // Teams
    teams: {
        enabled: boolean;
        webhook_url?: string;
        channels: Record<string, string>; // channel_name: webhook_url
    };
    
    // Push Notifications
    push: {
        enabled: boolean;
        vapid_public_key?: string;
    };
    
    // Notification Rules
    rules: NotificationRule[];
}

export interface EmailTemplate {
    subject: string;
    body: string; // HTML template
    variables: string[]; // Available variables
}

export interface NotificationRule {
    id: string;
    name: string;
    enabled: boolean;
    event: string; // e.g., "task.assigned", "task.completed"
    conditions: Record<string, any>;
    recipients: {
        roles?: string[];
        users?: string[];
        dynamic?: 'requester' | 'driver' | 'mlc' | 'assigned_to';
    };
    channels: ('email' | 'sms' | 'push' | 'teams')[];
    template: string;
    throttle_minutes?: number; // Prevent spam
}

// ====================================
// Reporting
// ====================================

export interface ReportingConfig {
    // Dashboard
    dashboard: {
        default_kpis: string[]; // Which KPIs to show
        refresh_interval_seconds: number;
        date_range_default: 'today' | 'week' | 'month';
    };
    
    // Report Templates
    templates: ReportTemplate[];
    
    // Data Retention
    data_retention: {
        task_history_days: number;
        pod_history_days: number;
        audit_log_days: number;
        archive_to_cold_storage: boolean;
    };
    
    // Export Settings
    export: {
        formats: ('csv' | 'excel' | 'pdf')[];
        max_rows: number;
        include_photos_in_pdf: boolean;
    };
    
    // Scheduled Reports
    scheduled_reports: {
        enabled: boolean;
        reports: ScheduledReport[];
    };
}

export interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    enabled: boolean;
    fields: string[];
    filters: Record<string, any>;
    grouping?: string[];
    sorting?: { field: string; direction: 'asc' | 'desc' }[];
    charts?: {
        type: 'bar' | 'line' | 'pie' | 'donut';
        data_field: string;
        label_field: string;
    }[];
}

export interface ScheduledReport {
    id: string;
    report_template_id: string;
    enabled: boolean;
    schedule: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:mm
    day_of_week?: number; // 0-6 for weekly
    day_of_month?: number; // 1-31 for monthly
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv';
}

// ====================================
// Integrations
// ====================================

export interface IntegrationConfig {
    // Materials App
    materials: {
        enabled: boolean;
        auto_create_tasks: boolean;
        auto_update_status: boolean;
        sync_interval_seconds: number;
    };
    
    // LTR (Toll provider)
    toll_ltr: {
        enabled: boolean;
        api_url?: string;
        api_key?: string;
        auto_create_bookings: boolean;
    };
    
    // External APIs
    external_apis: {
        name: string;
        enabled: boolean;
        base_url: string;
        auth_type: 'api_key' | 'oauth' | 'basic';
        credentials: Record<string, string>;
    }[];
    
    // Webhooks
    webhooks: {
        enabled: boolean;
        endpoints: WebhookEndpoint[];
    };
}

export interface WebhookEndpoint {
    id: string;
    name: string;
    enabled: boolean;
    url: string;
    events: string[];
    headers?: Record<string, string>;
    retry_on_failure: boolean;
    max_retries: number;
}

// ====================================
// Business Rules
// ====================================

export interface BusinessRules {
    // Task Assignment
    assignment: {
        max_tasks_per_driver: number;
        consider_driver_location: boolean;
        consider_vehicle_capacity: boolean;
        allow_reassignment: boolean;
        require_skills_match: boolean;
    };
    
    // Vehicle Rules
    vehicle: {
        require_vehicle_for_tasks: boolean;
        track_maintenance: boolean;
        enforce_capacity_limits: boolean;
    };
    
    // Zone Rules
    zones: {
        enforce_zone_restrictions: boolean;
        require_zone_access_approval: boolean;
        validate_gps_in_zone: boolean;
    };
    
    // Priority Rules
    priority: {
        auto_escalate_priority: boolean;
        escalation_rules: {
            from_priority: string;
            to_priority: string;
            after_minutes: number;
            conditions?: Record<string, any>;
        }[];
    };
    
    // Cost Rules
    cost: {
        track_task_costs: boolean;
        require_cost_approval_above: number;
        cost_centers: string[];
    };
}

// ====================================
// UI Customization
// ====================================

export interface UIConfig {
    // Branding
    branding: {
        logo_url?: string;
        primary_color: string;
        secondary_color: string;
        site_title: string;
    };
    
    // Layout
    layout: {
        default_view: 'dispatcher' | 'driver' | 'config';
        show_sidebar: boolean;
        compact_mode: boolean;
    };
    
    // Tables
    tables: {
        default_page_size: number;
        available_page_sizes: number[];
        show_filters_by_default: boolean;
    };
    
    // Maps
    maps: {
        enabled: boolean;
        provider: 'google' | 'mapbox' | 'osm';
        api_key?: string;
        default_center: { lat: number; lng: number };
        default_zoom: number;
    };
    
    // Date/Time
    date_time: {
        timezone: string;
        date_format: string; // e.g., "DD/MM/YYYY"
        time_format: '12h' | '24h';
        week_starts_on: 'sunday' | 'monday';
    };
    
    // Language
    language: {
        default: string; // e.g., "en-AU"
        available: string[];
    };
}

// ====================================
// Site Config Store
// ====================================

class SiteConfigManager {
    private configs: Map<string, SiteConfig> = new Map();
    private currentSiteId: string = 'default';

    /**
     * Load site configuration
     */
    loadConfig(siteId: string): void {
        try {
            const stored = localStorage.getItem(`site_config:${siteId}`);
            if (stored) {
                const config = JSON.parse(stored);
                this.configs.set(siteId, config);
                console.log(`✅ Loaded config for site: ${siteId}`);
            } else {
                // Use default config
                this.configs.set(siteId, this.getDefaultConfig(siteId));
            }
        } catch (error) {
            console.error(`Error loading config for site ${siteId}:`, error);
            this.configs.set(siteId, this.getDefaultConfig(siteId));
        }
    }

    /**
     * Save site configuration
     */
    saveConfig(siteId: string, config: SiteConfig): void {
        try {
            localStorage.setItem(`site_config:${siteId}`, JSON.stringify(config));
            this.configs.set(siteId, config);
            console.log(`✅ Saved config for site: ${siteId}`);
        } catch (error) {
            console.error(`Error saving config for site ${siteId}:`, error);
        }
    }

    /**
     * Get configuration for specific site
     */
    getConfig(siteId?: string): SiteConfig {
        const id = siteId || this.currentSiteId;
        if (!this.configs.has(id)) {
            this.loadConfig(id);
        }
        return this.configs.get(id) || this.getDefaultConfig(id);
    }

    /**
     * Set current site
     */
    setCurrentSite(siteId: string): void {
        this.currentSiteId = siteId;
        if (!this.configs.has(siteId)) {
            this.loadConfig(siteId);
        }
        console.log(`📍 Switched to site: ${siteId}`);
    }

    /**
     * Get current site ID
     */
    getCurrentSiteId(): string {
        return this.currentSiteId;
    }

    /**
     * Check if feature is enabled for current site
     */
    isFeatureEnabled(feature: keyof SiteFeatures): boolean {
        const config = this.getConfig();
        return config.features[feature] || false;
    }

    /**
     * Get workflow config
     */
    getWorkflow<K extends keyof SiteWorkflows>(workflowKey: K): SiteWorkflows[K] {
        const config = this.getConfig();
        return config.workflows[workflowKey];
    }

    /**
     * Get SLA rules
     */
    getSLARules(): SLARules {
        const config = this.getConfig();
        return config.sla_rules;
    }

    /**
     * Get notification config
     */
    getNotificationConfig(): NotificationConfig {
        const config = this.getConfig();
        return config.notifications;
    }

    /**
     * Get default configuration
     */
    private getDefaultConfig(siteId: string): SiteConfig {
        return {
            site_id: siteId,
            site_code: siteId.toUpperCase(),
            site_name: `Site ${siteId}`,
            enabled: true,
            
            features: {
                task_management: true,
                pod_capture: true,
                offline_mode: true,
                auto_task_creation: true,
                real_time_tracking: true,
                signature_required: false,
                photo_mandatory: true,
                materials_integration: true,
                toll_ltr_integration: false,
                teams_integration: false,
                sms_notifications: false,
                email_notifications: true,
                driver_mobile_app: true,
                driver_ratings: false,
                driver_notes: true,
                advanced_reports: true,
                custom_dashboards: true,
                data_export: true,
                scheduled_reports: false,
                multi_site_view: false,
                bulk_operations: true,
                audit_logging: true,
            },
            
            workflows: {
                task_creation: {
                    requires_approval: false,
                    approver_roles: ['mlc'],
                    auto_assign: false,
                    assignment_logic: 'manual',
                },
                task_execution: {
                    require_pickup_confirmation: true,
                    require_dropoff_confirmation: true,
                    allow_partial_completion: false,
                    require_pod_verification: false,
                },
                pod_workflow: {
                    min_photos: 1,
                    max_photos: 10,
                    signature_required: false,
                    gps_verification: true,
                    gps_tolerance_meters: 100,
                    require_receiver_phone: false,
                    require_delivery_notes: false,
                },
                exception_workflow: {
                    auto_escalate: false,
                    escalation_timeout_minutes: 60,
                    escalation_chain: ['mlc', 'manager'],
                    require_photos: true,
                    require_resolution_notes: true,
                },
                approval_workflow: {
                    high_priority_approval: false,
                    critical_priority_approval: true,
                    after_hours_approval: false,
                    approver_roles: ['mlc', 'manager'],
                },
            },
            
            sla_rules: {
                enabled: true,
                default_slas: {
                    critical: 60,  // 1 hour
                    high: 240,     // 4 hours
                    normal: 480,   // 8 hours
                    low: 1440,     // 24 hours
                },
                task_type_slas: {
                    delivery: { critical: 60, high: 240, normal: 480, low: 1440 },
                    collection: { critical: 120, high: 360, normal: 720, low: 1440 },
                    transfer: { critical: 90, high: 300, normal: 600, low: 1440 },
                },
                business_hours: {
                    enabled: true,
                    timezone: 'Australia/Brisbane',
                    monday: { start: '07:00', end: '17:00' },
                    tuesday: { start: '07:00', end: '17:00' },
                    wednesday: { start: '07:00', end: '17:00' },
                    thursday: { start: '07:00', end: '17:00' },
                    friday: { start: '07:00', end: '17:00' },
                    saturday: null,
                    sunday: null,
                },
                calculation: {
                    exclude_weekends: true,
                    exclude_holidays: true,
                    exclude_after_hours: true,
                    buffer_minutes: 15,
                },
                alerts: {
                    warn_at_percentage: 80,
                    breach_notification: true,
                    escalate_on_breach: true,
                },
            },
            
            notifications: {
                email: {
                    enabled: true,
                    from_address: 'noreply@logistics.com',
                    from_name: 'Logistics System',
                    templates: {},
                },
                sms: {
                    enabled: false,
                    provider: 'twilio',
                    templates: {},
                },
                teams: {
                    enabled: false,
                    channels: {},
                },
                push: {
                    enabled: false,
                },
                rules: [],
            },
            
            reporting: {
                dashboard: {
                    default_kpis: ['total_tasks', 'completed_tasks', 'in_progress', 'exceptions', 'sla_compliance'],
                    refresh_interval_seconds: 30,
                    date_range_default: 'today',
                },
                templates: [],
                data_retention: {
                    task_history_days: 365,
                    pod_history_days: 730,
                    audit_log_days: 1095,
                    archive_to_cold_storage: false,
                },
                export: {
                    formats: ['csv', 'excel', 'pdf'],
                    max_rows: 10000,
                    include_photos_in_pdf: false,
                },
                scheduled_reports: {
                    enabled: false,
                    reports: [],
                },
            },
            
            integrations: {
                materials: {
                    enabled: true,
                    auto_create_tasks: true,
                    auto_update_status: true,
                    sync_interval_seconds: 30,
                },
                toll_ltr: {
                    enabled: false,
                },
                external_apis: [],
                webhooks: {
                    enabled: false,
                    endpoints: [],
                },
            },
            
            business_rules: {
                assignment: {
                    max_tasks_per_driver: 5,
                    consider_driver_location: true,
                    consider_vehicle_capacity: true,
                    allow_reassignment: true,
                    require_skills_match: false,
                },
                vehicle: {
                    require_vehicle_for_tasks: true,
                    track_maintenance: false,
                    enforce_capacity_limits: false,
                },
                zones: {
                    enforce_zone_restrictions: false,
                    require_zone_access_approval: false,
                    validate_gps_in_zone: true,
                },
                priority: {
                    auto_escalate_priority: false,
                    escalation_rules: [],
                },
                cost: {
                    track_task_costs: false,
                    require_cost_approval_above: 0,
                    cost_centers: [],
                },
            },
            
            ui_config: {
                branding: {
                    primary_color: '#0066cc',
                    secondary_color: '#44aa44',
                    site_title: 'Logistics Management',
                },
                layout: {
                    default_view: 'dispatcher',
                    show_sidebar: true,
                    compact_mode: false,
                },
                tables: {
                    default_page_size: 25,
                    available_page_sizes: [10, 25, 50, 100],
                    show_filters_by_default: true,
                },
                maps: {
                    enabled: false,
                    provider: 'google',
                    default_center: { lat: -27.4698, lng: 153.0251 }, // Brisbane
                    default_zoom: 12,
                },
                date_time: {
                    timezone: 'Australia/Brisbane',
                    date_format: 'DD/MM/YYYY',
                    time_format: '24h',
                    week_starts_on: 'monday',
                },
                language: {
                    default: 'en-AU',
                    available: ['en-AU', 'en-US'],
                },
            },
        };
    }
}

// Export singleton instance
export const siteConfigManager = new SiteConfigManager();

// Initialize with default site
siteConfigManager.setCurrentSite('default');

