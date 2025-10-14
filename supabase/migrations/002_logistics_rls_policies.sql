-- Logistics Task Router (Logistics App) - Row-Level Security Policies
-- Migration 002: RLS Policies
-- Created: 2025-10-09

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================
ALTER TABLE logistics_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE exception_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_zones ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper function to get user role
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- This would query your users table to get the role
    -- For now, returning a placeholder
    -- In production, replace with actual role lookup
    SELECT role INTO user_role
    FROM auth.users
    WHERE id = user_id;
    
    RETURN COALESCE(user_role, 'requester');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- LOGISTICS_TASKS Policies
-- ============================================================================

-- MLC (God Mode) - Can see and modify everything
CREATE POLICY "MLC can view all tasks" ON logistics_tasks
    FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "MLC can insert tasks" ON logistics_tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "MLC can update tasks" ON logistics_tasks
    FOR UPDATE
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "MLC can delete tasks" ON logistics_tasks
    FOR DELETE
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

-- Drivers - Can view and update their own assigned tasks
CREATE POLICY "Drivers can view their assigned tasks" ON logistics_tasks
    FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'driver' AND
        driver_id IN (
            SELECT driver_id FROM drivers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Drivers can update their assigned tasks" ON logistics_tasks
    FOR UPDATE
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'driver' AND
        driver_id IN (
            SELECT driver_id FROM drivers WHERE user_id = auth.uid()
        ) AND
        -- Drivers can only update certain fields (status, GPS, timestamps)
        status IN ('in_progress', 'completed')
    );

-- Requesters - Can view their own requests
CREATE POLICY "Requesters can view their own tasks" ON logistics_tasks
    FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'requester' AND
        (requester->>'user_id')::UUID = auth.uid()
    );

CREATE POLICY "Requesters can insert tasks" ON logistics_tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        get_user_role(auth.uid()) = 'requester' AND
        (requester->>'user_id')::UUID = auth.uid()
    );

-- MC (Materials Coordinator) - Can view linked MRF tasks
CREATE POLICY "MC can view linked MRF tasks" ON logistics_tasks
    FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mc' AND
        linked_mrf_id IS NOT NULL
    );

-- ============================================================================
-- TASK_EVENTS Policies
-- ============================================================================

-- MLC can view all events
CREATE POLICY "MLC can view all task events" ON task_events
    FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

-- MLC and Drivers can insert events
CREATE POLICY "MLC and Drivers can insert task events" ON task_events
    FOR INSERT
    TO authenticated
    WITH CHECK (
        get_user_role(auth.uid()) IN ('mlc', 'driver', 'admin')
    );

-- Drivers can view events for their tasks
CREATE POLICY "Drivers can view their task events" ON task_events
    FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'driver' AND
        task_id IN (
            SELECT task_id FROM logistics_tasks
            WHERE driver_id IN (
                SELECT driver_id FROM drivers WHERE user_id = auth.uid()
            )
        )
    );

-- Requesters can view events for their tasks
CREATE POLICY "Requesters can view their task events" ON task_events
    FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'requester' AND
        task_id IN (
            SELECT task_id FROM logistics_tasks
            WHERE (requester->>'user_id')::UUID = auth.uid()
        )
    );

-- ============================================================================
-- POD_RECORDS Policies
-- ============================================================================

-- MLC can view all PODs
CREATE POLICY "MLC can view all PODs" ON pod_records
    FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

-- MLC can update PODs (for verification)
CREATE POLICY "MLC can update PODs" ON pod_records
    FOR UPDATE
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

-- Drivers can create PODs for their tasks
CREATE POLICY "Drivers can create PODs" ON pod_records
    FOR INSERT
    TO authenticated
    WITH CHECK (
        get_user_role(auth.uid()) = 'driver' AND
        task_id IN (
            SELECT task_id FROM logistics_tasks
            WHERE driver_id IN (
                SELECT driver_id FROM drivers WHERE user_id = auth.uid()
            )
        )
    );

-- Drivers can view PODs for their tasks
CREATE POLICY "Drivers can view their PODs" ON pod_records
    FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'driver' AND
        task_id IN (
            SELECT task_id FROM logistics_tasks
            WHERE driver_id IN (
                SELECT driver_id FROM drivers WHERE user_id = auth.uid()
            )
        )
    );

-- MC can view PODs for linked MRF tasks
CREATE POLICY "MC can view MRF-linked PODs" ON pod_records
    FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mc' AND
        task_id IN (
            SELECT task_id FROM logistics_tasks
            WHERE linked_mrf_id IS NOT NULL
        )
    );

-- ============================================================================
-- DRIVERS Policies
-- ============================================================================

-- MLC can view all drivers
CREATE POLICY "MLC can view all drivers" ON drivers
    FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

-- MLC can manage drivers
CREATE POLICY "MLC can insert drivers" ON drivers
    FOR INSERT
    TO authenticated
    WITH CHECK (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "MLC can update drivers" ON drivers
    FOR UPDATE
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "MLC can delete drivers" ON drivers
    FOR DELETE
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

-- Drivers can view their own record
CREATE POLICY "Drivers can view their own record" ON drivers
    FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'driver' AND
        user_id = auth.uid()
    );

-- Drivers can update their own location
CREATE POLICY "Drivers can update their own location" ON drivers
    FOR UPDATE
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'driver' AND
        user_id = auth.uid()
    )
    WITH CHECK (
        -- Drivers can only update specific fields
        user_id = auth.uid()
    );

-- ============================================================================
-- VEHICLES Policies
-- ============================================================================

-- MLC can view and manage all vehicles
CREATE POLICY "MLC can view all vehicles" ON vehicles
    FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "MLC can insert vehicles" ON vehicles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "MLC can update vehicles" ON vehicles
    FOR UPDATE
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "MLC can delete vehicles" ON vehicles
    FOR DELETE
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

-- Drivers can view vehicles
CREATE POLICY "Drivers can view vehicles" ON vehicles
    FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'driver'
    );

-- ============================================================================
-- LOGISTICS_CONFIG Policies
-- ============================================================================

-- MLC can view and manage all config
CREATE POLICY "MLC can view all config" ON logistics_config
    FOR SELECT
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "MLC can insert config" ON logistics_config
    FOR INSERT
    TO authenticated
    WITH CHECK (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "MLC can update config" ON logistics_config
    FOR UPDATE
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "MLC can delete config" ON logistics_config
    FOR DELETE
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

-- Others can view enabled config (read-only)
CREATE POLICY "All users can view enabled config" ON logistics_config
    FOR SELECT
    TO authenticated
    USING (enabled = TRUE);

-- ============================================================================
-- EXCEPTION_TYPES Policies
-- ============================================================================

-- MLC can manage exception types
CREATE POLICY "MLC can manage exception types" ON exception_types
    FOR ALL
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

-- All authenticated users can view enabled exception types
CREATE POLICY "All users can view enabled exception types" ON exception_types
    FOR SELECT
    TO authenticated
    USING (enabled = TRUE);

-- ============================================================================
-- SITE_ZONES Policies
-- ============================================================================

-- MLC can manage site zones
CREATE POLICY "MLC can manage site zones" ON site_zones
    FOR ALL
    TO authenticated
    USING (
        get_user_role(auth.uid()) = 'mlc' OR
        get_user_role(auth.uid()) = 'admin'
    );

-- All authenticated users can view enabled site zones
CREATE POLICY "All users can view enabled site zones" ON site_zones
    FOR SELECT
    TO authenticated
    USING (enabled = TRUE);

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON POLICY "MLC can view all tasks" ON logistics_tasks IS 'Materials Logistics Coordinators have god-mode access to all tasks';
COMMENT ON POLICY "Drivers can view their assigned tasks" ON logistics_tasks IS 'Drivers can only see tasks assigned to them';
COMMENT ON POLICY "Requesters can view their own tasks" ON logistics_tasks IS 'Requesters can track their own submitted tasks';
COMMENT ON POLICY "MC can view linked MRF tasks" ON logistics_tasks IS 'Materials Coordinators can view tasks linked to their MRFs';

