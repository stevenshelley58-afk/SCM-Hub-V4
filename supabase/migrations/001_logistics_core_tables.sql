-- Logistics Task Request (Logistics App) - Core Database Schema
-- Migration 001: Core Tables
-- Created: 2025-10-09

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: logistics_tasks
-- Primary table for all logistics tasks
-- ============================================================================
CREATE TABLE logistics_tasks (
  -- Identity
  task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_number VARCHAR(20) UNIQUE NOT NULL,
  
  -- Type & Category
  type VARCHAR(50) NOT NULL CHECK (type IN ('delivery', 'collection', 'container_move', 'yard_work', 'project_move', 'backload', 'adhoc')),
  category VARCHAR(50),
  priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  
  -- Requester Info (JSON for flexibility)
  requester JSONB NOT NULL,
  
  -- Task Details
  description TEXT NOT NULL,
  special_instructions TEXT,
  linked_mrf_id VARCHAR(20),
  linked_wo_id VARCHAR(20),
  linked_entity_type VARCHAR(50),
  linked_entity_id VARCHAR(50),
  
  -- Locations (JSON for flexibility)
  pickup JSONB NOT NULL,
  dropoff JSONB NOT NULL,
  
  -- Load Info
  load_info JSONB,
  
  -- Schedule
  requested_date TIMESTAMPTZ NOT NULL,
  requested_time TIME,
  hard_window_flag BOOLEAN DEFAULT FALSE,
  sla_target_at TIMESTAMPTZ,
  
  -- Status & Lifecycle
  status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'scheduled', 'in_progress', 'completed', 'verified', 'closed', 'exception', 'cancelled', 'on_hold')),
  status_reason TEXT,
  
  -- Assignment
  driver_id UUID,
  vehicle_id UUID,
  assigned_at TIMESTAMPTZ,
  assigned_by UUID,
  
  -- Execution
  started_at TIMESTAMPTZ,
  pickup_arrived_at TIMESTAMPTZ,
  pickup_completed_at TIMESTAMPTZ,
  dropoff_arrived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  
  -- POD Reference
  pod_id UUID,
  
  -- Attachments
  attachments JSONB,
  
  -- Approval Chain (optional)
  approval_required BOOLEAN DEFAULT FALSE,
  approvers JSONB,
  
  -- GPS Tracking
  gps_logs JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  
  -- Soft Delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- Indices for logistics_tasks
CREATE INDEX idx_logistics_tasks_status ON logistics_tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_logistics_tasks_driver ON logistics_tasks(driver_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_logistics_tasks_type ON logistics_tasks(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_logistics_tasks_requested_date ON logistics_tasks(requested_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_logistics_tasks_sla_target ON logistics_tasks(sla_target_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_logistics_tasks_linked_mrf ON logistics_tasks(linked_mrf_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_logistics_tasks_created_at ON logistics_tasks(created_at DESC) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: task_events
-- Audit log for all task status changes and events
-- ============================================================================
CREATE TABLE task_events (
  -- Identity
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL,
  
  -- Event Details
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('created', 'assigned', 'status_changed', 'driver_started', 'arrived', 'completed', 'exception', 'note_added', 'cancelled', 'on_hold', 'resumed')),
  status_from VARCHAR(50),
  status_to VARCHAR(50),
  
  -- Actor
  actor_id UUID,
  actor_name VARCHAR(255),
  actor_role VARCHAR(50),
  
  -- Context
  event_data JSONB,
  notes TEXT,
  
  -- GPS (if available)
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  gps_accuracy DECIMAL(10, 2),
  
  -- Photos/Attachments
  photo_refs JSONB,
  
  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for task_events
CREATE INDEX idx_task_events_task ON task_events(task_id, timestamp DESC);
CREATE INDEX idx_task_events_type ON task_events(event_type);
CREATE INDEX idx_task_events_timestamp ON task_events(timestamp DESC);

-- ============================================================================
-- TABLE: pod_records
-- Proof of Delivery records
-- ============================================================================
CREATE TABLE pod_records (
  -- Identity
  pod_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL,
  
  -- Signature
  signature_img TEXT,
  signature_name VARCHAR(255),
  signature_timestamp TIMESTAMPTZ,
  
  -- Photos (mandatory artefacts)
  photos JSONB NOT NULL,
  photo_count INTEGER NOT NULL DEFAULT 0,
  
  -- GPS Verification
  delivery_gps_lat DECIMAL(10, 8),
  delivery_gps_lng DECIMAL(11, 8),
  delivery_gps_accuracy DECIMAL(10, 2),
  gps_verified BOOLEAN DEFAULT FALSE,
  gps_verification_notes TEXT,
  
  -- Delivery Details
  delivered_to VARCHAR(255),
  delivered_to_phone VARCHAR(50),
  delivery_notes TEXT,
  
  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Exceptions
  exception_flag BOOLEAN DEFAULT FALSE,
  exception_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

-- Indices for pod_records
CREATE INDEX idx_pod_records_task ON pod_records(task_id);
CREATE INDEX idx_pod_records_verified ON pod_records(verified);
CREATE INDEX idx_pod_records_created ON pod_records(created_at DESC);

-- ============================================================================
-- TABLE: drivers
-- Driver registry
-- ============================================================================
CREATE TABLE drivers (
  -- Identity
  driver_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  
  -- Personal Info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  employee_id VARCHAR(50),
  
  -- License
  license_number VARCHAR(50),
  license_class VARCHAR(50),
  license_expiry DATE,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'suspended')),
  availability BOOLEAN DEFAULT TRUE,
  
  -- Current Assignment
  current_task_id UUID,
  current_location JSONB,
  
  -- Stats
  tasks_completed INTEGER DEFAULT 0,
  tasks_in_progress INTEGER DEFAULT 0,
  avg_completion_time INTERVAL,
  rating DECIMAL(3, 2),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indices for drivers
CREATE INDEX idx_drivers_status ON drivers(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_drivers_user ON drivers(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_drivers_availability ON drivers(availability) WHERE status = 'active' AND deleted_at IS NULL;

-- ============================================================================
-- TABLE: vehicles
-- Vehicle registry
-- ============================================================================
CREATE TABLE vehicles (
  -- Identity
  vehicle_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Vehicle Info
  registration VARCHAR(50) NOT NULL UNIQUE,
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  vehicle_type VARCHAR(50) CHECK (vehicle_type IN ('truck', 'van', 'forklift', 'crane', 'ute', 'other')),
  
  -- Capacity
  max_weight_kg DECIMAL(10, 2),
  max_volume_m3 DECIMAL(10, 2),
  equipment JSONB,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'out_of_service')),
  current_driver_id UUID,
  current_location JSONB,
  
  -- Maintenance
  last_service_date DATE,
  next_service_date DATE,
  service_notes TEXT,
  
  -- Stats
  total_tasks INTEGER DEFAULT 0,
  total_distance_km DECIMAL(10, 2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indices for vehicles
CREATE INDEX idx_vehicles_status ON vehicles(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_registration ON vehicles(registration) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: logistics_config
-- Configuration table for MLC settings
-- ============================================================================
CREATE TABLE logistics_config (
  -- Identity
  config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  
  -- Value
  config_value JSONB NOT NULL,
  config_type VARCHAR(50) NOT NULL CHECK (config_type IN ('request_type', 'sla', 'site_zone', 'notification_rule', 'vehicle_type', 'integration', 'feature_toggle', 'other')),
  
  -- Metadata
  description TEXT,
  display_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID
);

-- Indices for logistics_config
CREATE INDEX idx_logistics_config_type ON logistics_config(config_type);
CREATE INDEX idx_logistics_config_enabled ON logistics_config(enabled);
CREATE INDEX idx_logistics_config_key ON logistics_config(config_key);

-- ============================================================================
-- TABLE: exception_types
-- Exception types for task management
-- ============================================================================
CREATE TABLE exception_types (
  exception_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  auto_escalate BOOLEAN DEFAULT FALSE,
  escalation_delay_minutes INTEGER,
  resolution_required BOOLEAN DEFAULT TRUE,
  enabled BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for exception_types
CREATE INDEX idx_exception_types_enabled ON exception_types(enabled);
CREATE INDEX idx_exception_types_code ON exception_types(code);

-- ============================================================================
-- TABLE: site_zones
-- Site zones for geofencing and location management
-- ============================================================================
CREATE TABLE site_zones (
  zone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_name VARCHAR(255) NOT NULL,
  zone_type VARCHAR(50) CHECK (zone_type IN ('delivery_location', 'pickup_zone', 'geofence', 'other')),
  gps_center JSONB,
  gps_radius DECIMAL(10, 2),
  gps_polygon JSONB,
  access_requirements TEXT,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(50),
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for site_zones
CREATE INDEX idx_site_zones_enabled ON site_zones(enabled);
CREATE INDEX idx_site_zones_type ON site_zones(zone_type);

-- ============================================================================
-- Foreign Key Constraints
-- ============================================================================
ALTER TABLE task_events ADD CONSTRAINT fk_task_events_task 
  FOREIGN KEY (task_id) REFERENCES logistics_tasks(task_id) ON DELETE CASCADE;

ALTER TABLE pod_records ADD CONSTRAINT fk_pod_records_task 
  FOREIGN KEY (task_id) REFERENCES logistics_tasks(task_id) ON DELETE CASCADE;

ALTER TABLE logistics_tasks ADD CONSTRAINT fk_logistics_tasks_driver 
  FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE SET NULL;

ALTER TABLE logistics_tasks ADD CONSTRAINT fk_logistics_tasks_vehicle 
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE SET NULL;

ALTER TABLE logistics_tasks ADD CONSTRAINT fk_logistics_tasks_pod 
  FOREIGN KEY (pod_id) REFERENCES pod_records(pod_id) ON DELETE SET NULL;

ALTER TABLE drivers ADD CONSTRAINT fk_drivers_current_task 
  FOREIGN KEY (current_task_id) REFERENCES logistics_tasks(task_id) ON DELETE SET NULL;

ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_current_driver 
  FOREIGN KEY (current_driver_id) REFERENCES drivers(driver_id) ON DELETE SET NULL;

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_logistics_tasks_updated_at BEFORE UPDATE ON logistics_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logistics_config_updated_at BEFORE UPDATE ON logistics_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Task Number Generation Function
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_task_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    task_num TEXT;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(task_number FROM 9) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM logistics_tasks
    WHERE task_number LIKE 'TT-' || year_part || '-%';
    
    -- Format as TT-YYYY-NNNNNN (e.g., TT-2025-000001)
    task_num := 'TT-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN task_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Auto-generate task_number on insert
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_generate_task_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.task_number IS NULL OR NEW.task_number = '' THEN
        NEW.task_number := generate_task_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_task_number
    BEFORE INSERT ON logistics_tasks
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_task_number();

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE logistics_tasks IS 'Primary table for all logistics tasks including deliveries, collections, and other movements';
COMMENT ON TABLE task_events IS 'Audit log tracking all status changes and events for tasks';
COMMENT ON TABLE pod_records IS 'Proof of Delivery records with photos, signatures, and GPS verification';
COMMENT ON TABLE drivers IS 'Driver registry with credentials, status, and performance metrics';
COMMENT ON TABLE vehicles IS 'Fleet vehicle registry with capacity, status, and maintenance tracking';
COMMENT ON TABLE logistics_config IS 'Configuration settings for MLC god-mode control panel';
COMMENT ON TABLE exception_types IS 'Configurable exception types for task management';
COMMENT ON TABLE site_zones IS 'Site zones for geofencing and delivery location management';

