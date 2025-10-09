# Toll Task Request (Logistics App) - Implementation Plan

**Generated:** 2025-10-09  
**Purpose:** Complete planning for Logistics App (MLC) build-out  
**Status:** Planning Phase  
**Version:** 1.0

---

## 🎯 EXECUTIVE SUMMARY

The **Toll Task Request** app (Logistics App) is a standalone operations system for the Materials Logistics Coordinator (MLC) team to manage ALL physical movement tasks across site and off-site:
- Deliveries, collections, transfers, yard jobs, container handling, ad-hoc site services
- Multi-customer intake (Materials, Maintenance, Projects, direct requests)
- Real-time visibility and digital proof of completion
- Designed as peer system to Materials app, NOT a child module

**Key Architectural Principles:**
1. **Standalone System:** Independent deployment, own database tables, own UI
2. **Event-Driven Integration:** Communicates with Materials app via Redis Streams (per ADR-002)
3. **Multi-Customer:** Materials is just one of many requesting clients
4. **Configurable:** MLC has god-mode control panel (mirror of MC backend)
5. **Mobile-First:** Driver app with offline capability for field operations

---

## 📋 TABLE OF CONTENTS

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Frontend Structure](#frontend-structure)
5. [Authentication & Authorization](#authentication--authorization)
6. [Materials App Integration](#materials-app-integration)
7. [Driver Mobile App](#driver-mobile-app)
8. [POD Capture System](#pod-capture-system)
9. [Reporting & KPIs](#reporting--kpis)
10. [MLC Configuration Panel](#mlc-configuration-panel)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Testing Strategy](#testing-strategy)

---

## 🏗️ SYSTEM ARCHITECTURE

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LOGISTICS APP (MLC)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dispatcher  │  │    Driver    │  │     MLC      │     │
│  │     View     │  │   Mobile     │  │   Control    │     │
│  │              │  │     App      │  │    Panel     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │             │
│         └─────────────────┼─────────────────┘             │
│                           │                               │
│         ┌─────────────────┴─────────────────┐             │
│         │      API Layer (REST/GraphQL)      │             │
│         └─────────────────┬─────────────────┘             │
│                           │                               │
│         ┌─────────────────┴─────────────────┐             │
│         │       Service Layer               │             │
│         │  - Task Management                │             │
│         │  - Assignment Logic               │             │
│         │  - SLA Tracking                   │             │
│         │  - POD Processing                 │             │
│         │  - Event Publishing               │             │
│         └─────────────────┬─────────────────┘             │
│                           │                               │
│         ┌─────────────────┴─────────────────┐             │
│         │         Database Layer            │             │
│         │  - logistics_tasks                │             │
│         │  - task_events                    │             │
│         │  - pod_records                    │             │
│         │  - vehicles                       │             │
│         │  - drivers                        │             │
│         └─────────────────┬─────────────────┘             │
│                           │                               │
└───────────────────────────┼───────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
   ┌──────────┐      ┌──────────┐     ┌──────────┐
   │ Materials│◀────▶│  Redis   │◀───▶│  Other   │
   │   App    │      │ Streams  │     │  Clients │
   └──────────┘      └──────────┘     └──────────┘
                            │
                            ▼
                   ┌──────────────┐
                   │   Storage    │
                   │ (Supabase/   │
                   │   MinIO)     │
                   └──────────────┘
```

### Component Breakdown

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend - Dispatcher** | React + TypeScript + Tailwind | Desktop web app for MLC to manage queue, assign tasks |
| **Frontend - Driver** | React + PWA + Offline-first | Mobile-optimized driver app for task execution |
| **Frontend - MLC Control** | React + TypeScript + Tailwind | God-mode configuration panel |
| **API Layer** | Supabase Edge Functions / FastAPI | REST endpoints for CRUD operations |
| **Service Layer** | TypeScript Services | Business logic, SLA tracking, event publishing |
| **Database** | PostgreSQL (Supabase) | Primary data store with RLS policies |
| **Event Bus** | Redis Streams | Async communication with Materials app |
| **Storage** | Supabase Storage / MinIO | POD photos, signatures, attachments |
| **Queue** | Redis Streams + Consumer Groups | Task assignment queue |

---

## 🗄️ DATABASE SCHEMA

### Core Tables

#### 1. `logistics_tasks`

Primary table for all logistics tasks.

```sql
CREATE TABLE logistics_tasks (
  -- Identity
  task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_number VARCHAR(20) UNIQUE NOT NULL, -- e.g., "TT-2025-001234"
  
  -- Type & Category
  type VARCHAR(50) NOT NULL, -- 'delivery', 'collection', 'container_move', 'yard_work', 'project_move', 'backload', 'adhoc'
  category VARCHAR(50), -- Sub-category (configurable by MLC)
  priority VARCHAR(10) NOT NULL DEFAULT 'normal', -- 'critical', 'high', 'normal', 'low'
  
  -- Requester Info (JSON for flexibility)
  requester JSONB NOT NULL, -- { name, department, phone, email, cost_centre, user_id }
  
  -- Task Details
  description TEXT NOT NULL,
  special_instructions TEXT,
  linked_mrf_id VARCHAR(20), -- Optional: Link to Materials Request
  linked_wo_id VARCHAR(20), -- Optional: Link to Work Order
  linked_entity_type VARCHAR(50), -- 'mrf', 'work_order', 'maintenance', 'project', 'adhoc'
  linked_entity_id VARCHAR(50),
  
  -- Locations (JSON for flexibility)
  pickup JSONB NOT NULL, -- { location, site_gate, contact, phone, gps, access_notes }
  dropoff JSONB NOT NULL, -- { location, site_gate, contact, phone, gps, access_notes }
  
  -- Load Info
  load_info JSONB, -- { qty, weight, dimensions, container_no, hazard_flag, equipment_required }
  
  -- Schedule
  requested_date TIMESTAMPTZ NOT NULL,
  requested_time TIME,
  hard_window_flag BOOLEAN DEFAULT FALSE, -- If true, must be delivered in specified window
  sla_target_at TIMESTAMPTZ, -- Calculated based on type + requested date
  
  -- Status & Lifecycle
  status VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new', 'scheduled', 'in_progress', 'completed', 'verified', 'closed', 'exception'
  status_reason TEXT, -- Reason for current status (especially exceptions)
  
  -- Assignment
  driver_id UUID REFERENCES drivers(driver_id),
  vehicle_id UUID REFERENCES vehicles(vehicle_id),
  assigned_at TIMESTAMPTZ,
  assigned_by UUID REFERENCES users(id),
  
  -- Execution
  started_at TIMESTAMPTZ,
  pickup_arrived_at TIMESTAMPTZ,
  pickup_completed_at TIMESTAMPTZ,
  dropoff_arrived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES users(id),
  
  -- POD Reference
  pod_id UUID REFERENCES pod_records(pod_id),
  
  -- Attachments
  attachments JSONB, -- [{ id, filename, url, type, uploaded_by, uploaded_at }]
  
  -- Approval Chain (optional)
  approval_required BOOLEAN DEFAULT FALSE,
  approvers JSONB, -- [{ name, role, email, approved, approved_at }]
  
  -- GPS Tracking
  gps_logs JSONB, -- [{ timestamp, lat, lng, accuracy, event }]
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  
  -- Soft Delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),
  
  -- Indices
  INDEX idx_task_status (status),
  INDEX idx_task_driver (driver_id),
  INDEX idx_task_type (type),
  INDEX idx_task_requested_date (requested_date),
  INDEX idx_task_sla_target (sla_target_at),
  INDEX idx_linked_mrf (linked_mrf_id),
  INDEX idx_created_at (created_at DESC)
);
```

#### 2. `task_events`

Audit log for all task status changes and events.

```sql
CREATE TABLE task_events (
  -- Identity
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES logistics_tasks(task_id) ON DELETE CASCADE,
  
  -- Event Details
  event_type VARCHAR(50) NOT NULL, -- 'created', 'assigned', 'status_changed', 'driver_started', 'arrived', 'completed', 'exception', 'note_added'
  status_from VARCHAR(50),
  status_to VARCHAR(50),
  
  -- Actor
  actor_id UUID REFERENCES users(id),
  actor_name VARCHAR(255),
  actor_role VARCHAR(50),
  
  -- Context
  event_data JSONB, -- Additional context (notes, photos, gps, etc.)
  notes TEXT,
  
  -- GPS (if available)
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  gps_accuracy DECIMAL(10, 2), -- meters
  
  -- Photos/Attachments
  photo_refs JSONB, -- [{ id, url, thumbnail_url, type }]
  
  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indices
  INDEX idx_event_task (task_id, timestamp DESC),
  INDEX idx_event_type (event_type),
  INDEX idx_event_timestamp (timestamp DESC)
);
```

#### 3. `pod_records`

Proof of Delivery records.

```sql
CREATE TABLE pod_records (
  -- Identity
  pod_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES logistics_tasks(task_id) ON DELETE CASCADE,
  
  -- Signature
  signature_img TEXT, -- Base64 or signed URL
  signature_name VARCHAR(255), -- Name of person who signed
  signature_timestamp TIMESTAMPTZ,
  
  -- Photos (mandatory artefacts)
  photos JSONB NOT NULL, -- [{ id, url, thumbnail_url, type, caption, timestamp }]
  photo_count INTEGER NOT NULL DEFAULT 0,
  
  -- GPS Verification
  delivery_gps_lat DECIMAL(10, 8),
  delivery_gps_lng DECIMAL(11, 8),
  delivery_gps_accuracy DECIMAL(10, 2),
  gps_verified BOOLEAN DEFAULT FALSE, -- True if within configured site radius
  gps_verification_notes TEXT,
  
  -- Delivery Details
  delivered_to VARCHAR(255), -- Name of receiver
  delivered_to_phone VARCHAR(50),
  delivery_notes TEXT,
  
  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Exceptions
  exception_flag BOOLEAN DEFAULT FALSE,
  exception_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Indices
  INDEX idx_pod_task (task_id),
  INDEX idx_pod_verified (verified),
  INDEX idx_pod_created (created_at DESC)
);
```

#### 4. `drivers`

Driver registry.

```sql
CREATE TABLE drivers (
  -- Identity
  driver_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id), -- Link to auth user
  
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
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'on_leave', 'suspended'
  availability BOOLEAN DEFAULT TRUE,
  
  -- Current Assignment
  current_task_id UUID REFERENCES logistics_tasks(task_id),
  current_location JSONB, -- { lat, lng, accuracy, timestamp }
  
  -- Stats
  tasks_completed INTEGER DEFAULT 0,
  tasks_in_progress INTEGER DEFAULT 0,
  avg_completion_time INTERVAL,
  rating DECIMAL(3, 2), -- 0.00 to 5.00
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Indices
  INDEX idx_driver_status (status),
  INDEX idx_driver_user (user_id)
);
```

#### 5. `vehicles`

Vehicle registry.

```sql
CREATE TABLE vehicles (
  -- Identity
  vehicle_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Vehicle Info
  registration VARCHAR(50) NOT NULL UNIQUE,
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  vehicle_type VARCHAR(50), -- 'truck', 'van', 'forklift', 'crane', 'ute'
  
  -- Capacity
  max_weight_kg DECIMAL(10, 2),
  max_volume_m3 DECIMAL(10, 2),
  equipment JSONB, -- [{ name, type, capacity }]
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'available', -- 'available', 'in_use', 'maintenance', 'out_of_service'
  current_driver_id UUID REFERENCES drivers(driver_id),
  current_location JSONB, -- { lat, lng, accuracy, timestamp }
  
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
  deleted_at TIMESTAMPTZ,
  
  -- Indices
  INDEX idx_vehicle_status (status),
  INDEX idx_vehicle_type (vehicle_type)
);
```

#### 6. `logistics_config`

Configuration table for MLC settings.

```sql
CREATE TABLE logistics_config (
  -- Identity
  config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  
  -- Value
  config_value JSONB NOT NULL,
  config_type VARCHAR(50) NOT NULL, -- 'request_type', 'sla', 'site_zone', 'notification_rule', 'vehicle_type', etc.
  
  -- Metadata
  description TEXT,
  display_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  
  -- Indices
  INDEX idx_config_type (config_type),
  INDEX idx_config_enabled (enabled)
);
```

### Supporting Tables

#### 7. `exception_types`

```sql
CREATE TABLE exception_types (
  exception_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  auto_escalate BOOLEAN DEFAULT FALSE,
  escalation_delay_minutes INTEGER,
  resolution_required BOOLEAN DEFAULT TRUE,
  enabled BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 8. `site_zones`

```sql
CREATE TABLE site_zones (
  zone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_name VARCHAR(255) NOT NULL,
  zone_type VARCHAR(50), -- 'delivery_location', 'pickup_zone', 'geofence'
  gps_center JSONB, -- { lat, lng }
  gps_radius DECIMAL(10, 2), -- meters
  gps_polygon JSONB, -- [{ lat, lng }, { lat, lng }, ...]
  access_requirements TEXT,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(50),
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 🔌 API ENDPOINTS

### REST API Structure

All endpoints follow pattern: `/api/logistics/*`

#### Task Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/logistics/tasks` | Create new task | Requester, MLC |
| `GET` | `/api/logistics/tasks` | List tasks (with filters) | All |
| `GET` | `/api/logistics/tasks/:id` | Get single task | All |
| `PATCH` | `/api/logistics/tasks/:id` | Update task | MLC, Driver (limited) |
| `DELETE` | `/api/logistics/tasks/:id` | Soft delete task | MLC only |
| `POST` | `/api/logistics/tasks/:id/assign` | Assign driver/vehicle | MLC |
| `POST` | `/api/logistics/tasks/:id/start` | Driver starts task | Driver |
| `POST` | `/api/logistics/tasks/:id/arrive` | Driver arrives at location | Driver |
| `POST` | `/api/logistics/tasks/:id/complete` | Driver completes task | Driver |
| `POST` | `/api/logistics/tasks/:id/verify` | MLC verifies completion | MLC |
| `POST` | `/api/logistics/tasks/:id/close` | MLC closes task | MLC |
| `POST` | `/api/logistics/tasks/:id/exception` | Raise exception | Driver, MLC |

#### POD Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/logistics/pod` | Create POD record | Driver |
| `GET` | `/api/logistics/pod/:id` | Get POD details | All |
| `PATCH` | `/api/logistics/pod/:id/verify` | Verify POD | MLC |
| `POST` | `/api/logistics/pod/upload-photo` | Upload POD photo | Driver |
| `POST` | `/api/logistics/pod/upload-signature` | Upload signature | Driver |

#### Driver Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/logistics/drivers` | Register driver | MLC |
| `GET` | `/api/logistics/drivers` | List drivers | MLC |
| `GET` | `/api/logistics/drivers/:id` | Get driver details | MLC, Driver (own) |
| `PATCH` | `/api/logistics/drivers/:id` | Update driver | MLC |
| `GET` | `/api/logistics/drivers/:id/tasks` | Get driver's tasks | Driver (own), MLC |
| `PATCH` | `/api/logistics/drivers/:id/location` | Update location | Driver |

#### Vehicle Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/logistics/vehicles` | Register vehicle | MLC |
| `GET` | `/api/logistics/vehicles` | List vehicles | MLC |
| `GET` | `/api/logistics/vehicles/:id` | Get vehicle details | MLC |
| `PATCH` | `/api/logistics/vehicles/:id` | Update vehicle | MLC |

#### Queue & Assignment

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/logistics/queue` | Get task queue | MLC, Driver |
| `POST` | `/api/logistics/queue/reorder` | Reorder queue (drag-drop) | MLC |
| `GET` | `/api/logistics/queue/available` | Get available drivers/vehicles | MLC |

#### Reporting

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/logistics/reports/tasks` | Task metrics | MLC |
| `GET` | `/api/logistics/reports/driver-performance` | Driver KPIs | MLC |
| `GET` | `/api/logistics/reports/sla-compliance` | SLA stats | MLC |
| `GET` | `/api/logistics/reports/exceptions` | Exception analysis | MLC |
| `POST` | `/api/logistics/reports/export` | Export report (CSV/PDF) | MLC |

#### Configuration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/logistics/config` | Get all config | MLC |
| `GET` | `/api/logistics/config/:type` | Get config by type | MLC |
| `PATCH` | `/api/logistics/config/:key` | Update config | MLC |
| `POST` | `/api/logistics/config/request-types` | Add request type | MLC |
| `POST` | `/api/logistics/config/site-zones` | Add site zone | MLC |

#### Integration Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/logistics/webhooks/materials` | Receive Materials app event | System (API Key) |
| `POST` | `/api/logistics/webhooks/external` | Receive external webhook | System (API Key) |

---

## 🎨 FRONTEND STRUCTURE

### Directory Structure

```
apps/
  logistics/
    ├── app/                          # Next.js App Router
    │   ├── (dispatcher)/             # Dispatcher/MLC routes
    │   │   ├── dashboard/
    │   │   ├── queue/
    │   │   ├── tasks/
    │   │   ├── drivers/
    │   │   ├── vehicles/
    │   │   └── reports/
    │   ├── (driver)/                 # Driver mobile routes
    │   │   ├── my-tasks/
    │   │   ├── task/[id]/
    │   │   └── pod/
    │   ├── (config)/                 # MLC config routes
    │   │   ├── settings/
    │   │   ├── request-types/
    │   │   ├── site-zones/
    │   │   └── notifications/
    │   └── api/                      # API routes (Next.js)
    │       ├── tasks/
    │       ├── drivers/
    │       ├── vehicles/
    │       ├── pod/
    │       └── webhooks/
    ├── components/
    │   ├── dispatcher/
    │   │   ├── TaskQueue.tsx
    │   │   ├── TaskCard.tsx
    │   │   ├── AssignmentModal.tsx
    │   │   ├── DriverAvailability.tsx
    │   │   └── MapView.tsx
    │   ├── driver/
    │   │   ├── TaskList.tsx
    │   │   ├── TaskDetail.tsx
    │   │   ├── PODCapture.tsx
    │   │   ├── SignaturePad.tsx
    │   │   └── CameraUpload.tsx
    │   ├── mlc/
    │   │   ├── ConfigPanel.tsx
    │   │   ├── RequestTypeManager.tsx
    │   │   ├── SiteZoneManager.tsx
    │   │   └── NotificationRules.tsx
    │   ├── shared/
    │   │   ├── TaskStatusBadge.tsx
    │   │   ├── PriorityIndicator.tsx
    │   │   ├── LocationPicker.tsx
    │   │   └── FileUpload.tsx
    │   └── ui/                       # Reusable UI components
    │       ├── Button.tsx
    │       ├── Modal.tsx
    │       ├── Table.tsx
    │       └── ...
    ├── services/
    │   ├── taskService.ts
    │   ├── driverService.ts
    │   ├── vehicleService.ts
    │   ├── podService.ts
    │   ├── queueService.ts
    │   ├── eventPublisher.ts          # Redis Streams publisher
    │   ├── gpsService.ts
    │   └── offlineService.ts          # For driver offline mode
    ├── hooks/
    │   ├── useTasks.ts
    │   ├── useDriverLocation.ts
    │   ├── useOffline.ts
    │   └── usePODCapture.ts
    ├── utils/
    │   ├── slaCalculator.ts
    │   ├── gpsValidator.ts
    │   ├── queueSorter.ts
    │   └── permissions.ts
    ├── types/
    │   ├── task.ts
    │   ├── driver.ts
    │   ├── vehicle.ts
    │   ├── pod.ts
    │   └── config.ts
    └── middleware.ts                 # Auth middleware
```

### Key Components

#### 1. TaskQueue (Dispatcher View)

```tsx
// components/dispatcher/TaskQueue.tsx
interface TaskQueueProps {
  tasks: LogisticsTask[];
  onReorder: (taskIds: string[]) => void;
  onAssign: (taskId: string) => void;
}

export function TaskQueue({ tasks, onReorder, onAssign }: TaskQueueProps) {
  // Drag-and-drop reordering
  // Real-time updates via Supabase Realtime
  // Color-coded by priority
  // SLA countdown timers
  // Quick actions (assign, view, edit)
}
```

#### 2. DriverTaskList (Driver View)

```tsx
// components/driver/TaskList.tsx
interface DriverTaskListProps {
  driverId: string;
}

export function DriverTaskList({ driverId }: DriverTaskListProps) {
  // Show tasks assigned to driver
  // Ordered by priority/delivery date
  // Offline-capable (sync when online)
  // Quick actions (start, arrive, complete)
  // Map integration for navigation
}
```

#### 3. PODCapture (Driver View)

```tsx
// components/driver/PODCapture.tsx
interface PODCaptureProps {
  taskId: string;
  onComplete: (pod: PODRecord) => void;
}

export function PODCapture({ taskId, onComplete }: PODCaptureProps) {
  // Camera for photos (multiple)
  // Signature pad
  // GPS auto-capture
  // Delivery notes
  // Offline storage, sync when online
  // Validation (photos mandatory, signature optional)
}
```

#### 4. ConfigPanel (MLC View)

```tsx
// components/mlc/ConfigPanel.tsx
export function ConfigPanel() {
  // Tabbed interface:
  // - Request Types & SLAs
  // - Site Zones & Geofences
  // - Drivers & Vehicles
  // - Notification Rules
  // - Integration Settings
  // - Feature Toggles
  
  // Mirror structure of MC Backend spec
}
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Requester** | Any site user needing logistics | Create task, track own tasks |
| **Driver** | Field operator | Update assigned tasks, capture POD |
| **MLC (God Mode)** | Logistics Coordinator | Full CRUD, assign drivers, configure system |
| **MC (Read-Only)** | Materials Coordinator | View linked tasks only |

### Permission Matrix

| Action | Requester | Driver | MLC | MC |
|--------|-----------|--------|-----|-----|
| Create task | ✅ | ❌ | ✅ | ❌ |
| View own tasks | ✅ | ✅ | ✅ | ✅ (linked) |
| View all tasks | ❌ | ❌ | ✅ | ❌ |
| Assign driver | ❌ | ❌ | ✅ | ❌ |
| Start task | ❌ | ✅ (own) | ✅ | ❌ |
| Capture POD | ❌ | ✅ (own) | ✅ | ❌ |
| Verify POD | ❌ | ❌ | ✅ | ❌ |
| Close task | ❌ | ❌ | ✅ | ❌ |
| Configure system | ❌ | ❌ | ✅ | ❌ |

### Row-Level Security (RLS)

```sql
-- Example: Drivers can only see their assigned tasks
CREATE POLICY driver_view_own_tasks ON logistics_tasks
  FOR SELECT
  TO authenticated
  USING (
    driver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.user_id = auth.uid()
        AND drivers.driver_id = logistics_tasks.driver_id
    )
  );

-- MLC can see everything
CREATE POLICY mlc_view_all_tasks ON logistics_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'mlc'
    )
  );

-- Requesters can only see their own requests
CREATE POLICY requester_view_own_tasks ON logistics_tasks
  FOR SELECT
  TO authenticated
  USING (
    requester->>'user_id' = auth.uid()::text
  );
```

---

## 🔄 MATERIALS APP INTEGRATION

### Event-Driven Communication

Following ADR-002 (Redis Streams), Materials and Logistics apps communicate via events.

#### Materials → Logistics Events

| Event Type | When | Payload | Action |
|------------|------|---------|--------|
| `mrf.ready_for_collection` | MRF reaches "Staged" status | `{ mrf_id, pickup, dropoff, priority, items, requester }` | Create logistics task |
| `mrf.updated` | MRF details change | `{ mrf_id, changes }` | Update linked task |
| `mrf.cancelled` | MRF cancelled | `{ mrf_id, reason }` | Cancel linked task |
| `mrf.on_hold` | MRF put on hold | `{ mrf_id, reason }` | Pause linked task |

#### Logistics → Materials Events

| Event Type | When | Payload | Action |
|------------|------|---------|--------|
| `task.accepted` | Driver accepts task | `{ task_id, mrf_id, driver, vehicle, eta }` | Update MRF status to "In Transit" |
| `task.in_transit` | Driver en route | `{ task_id, mrf_id, current_location, eta }` | Update MRF with ETA |
| `task.delivered` | POD captured | `{ task_id, mrf_id, pod, photos, signature, timestamp }` | Update MRF to "Delivered", attach POD |
| `task.exception` | Exception raised | `{ task_id, mrf_id, exception_type, reason }` | Notify MC, mark MRF exception |

### Event Publisher Service

```typescript
// services/eventPublisher.ts
import { EventPublisher } from '@shared/events/publisher';
import { redis } from '@shared/redis';

class LogisticsEventPublisher {
  private publisher: EventPublisher;

  constructor() {
    this.publisher = new EventPublisher(redis);
  }

  async publishTaskAccepted(task: LogisticsTask) {
    await this.publisher.publish({
      id: uuid(),
      version: '1.0',
      type: 'logistics.task.accepted',
      timestamp: new Date().toISOString(),
      source: 'logistics',
      correlation_id: task.linked_mrf_id,
      payload: {
        task_id: task.task_id,
        mrf_id: task.linked_mrf_id,
        driver: {
          name: task.driver?.name,
          phone: task.driver?.phone,
        },
        vehicle: {
          registration: task.vehicle?.registration,
          type: task.vehicle?.vehicle_type,
        },
        eta: task.estimated_delivery_time,
      },
    });
  }

  async publishTaskDelivered(task: LogisticsTask, pod: PODRecord) {
    await this.publisher.publish({
      id: uuid(),
      version: '1.0',
      type: 'logistics.task.delivered',
      timestamp: new Date().toISOString(),
      source: 'logistics',
      correlation_id: task.linked_mrf_id,
      payload: {
        task_id: task.task_id,
        mrf_id: task.linked_mrf_id,
        delivered_at: task.completed_at,
        delivered_to: pod.delivered_to,
        pod: {
          photos: pod.photos,
          signature: pod.signature_img,
          gps: {
            lat: pod.delivery_gps_lat,
            lng: pod.delivery_gps_lng,
            verified: pod.gps_verified,
          },
        },
      },
    });
  }

  async publishTaskException(task: LogisticsTask, exception: Exception) {
    await this.publisher.publish({
      id: uuid(),
      version: '1.0',
      type: 'logistics.task.exception',
      timestamp: new Date().toISOString(),
      source: 'logistics',
      correlation_id: task.linked_mrf_id,
      payload: {
        task_id: task.task_id,
        mrf_id: task.linked_mrf_id,
        exception_type: exception.type,
        exception_reason: exception.reason,
        severity: exception.severity,
      },
    });
  }
}

export const logisticsEventPublisher = new LogisticsEventPublisher();
```

### Event Subscriber Service

```typescript
// services/eventSubscriber.ts
import { EventSubscriber } from '@shared/events/subscriber';
import { redis } from '@shared/redis';
import { createLogisticsTask } from './taskService';

class MaterialsEventSubscriber {
  private subscriber: EventSubscriber;

  constructor() {
    this.subscriber = new EventSubscriber(
      redis,
      'logistics-consumers',
      `logistics-worker-${process.env.WORKER_ID || '1'}`
    );
  }

  async start() {
    await this.subscriber.subscribe('events:materials', async (event) => {
      switch (event.type) {
        case 'mrf.ready_for_collection':
          await this.handleMRFReady(event.payload);
          break;
        case 'mrf.updated':
          await this.handleMRFUpdated(event.payload);
          break;
        case 'mrf.cancelled':
          await this.handleMRFCancelled(event.payload);
          break;
        case 'mrf.on_hold':
          await this.handleMRFOnHold(event.payload);
          break;
      }
    });
  }

  private async handleMRFReady(payload: any) {
    // Create logistics task from MRF
    const task = await createLogisticsTask({
      type: 'delivery',
      category: 'materials_request',
      priority: payload.priority === 'P1' ? 'critical' : 'normal',
      requester: payload.requester,
      description: `Deliver materials for MRF ${payload.mrf_id}`,
      linked_mrf_id: payload.mrf_id,
      linked_entity_type: 'mrf',
      linked_entity_id: payload.mrf_id,
      pickup: payload.pickup,
      dropoff: payload.dropoff,
      load_info: {
        qty: payload.items.length,
        weight: payload.total_weight,
      },
      requested_date: payload.required_by_date,
      sla_target_at: this.calculateSLA(payload),
    });

    console.log(`✅ Created logistics task ${task.task_number} for MRF ${payload.mrf_id}`);
  }

  private async handleMRFUpdated(payload: any) {
    // Update linked logistics task
    const task = await db.logistics_tasks.findOne({ linked_mrf_id: payload.mrf_id });
    if (task && task.status !== 'completed') {
      await db.logistics_tasks.update(
        { task_id: task.task_id },
        { ...payload.changes }
      );
    }
  }

  private async handleMRFCancelled(payload: any) {
    // Cancel linked logistics task
    const task = await db.logistics_tasks.findOne({ linked_mrf_id: payload.mrf_id });
    if (task && task.status !== 'completed') {
      await db.logistics_tasks.update(
        { task_id: task.task_id },
        {
          status: 'cancelled',
          status_reason: `MRF cancelled: ${payload.reason}`,
        }
      );
    }
  }

  private calculateSLA(payload: any): Date {
    const requestedDate = new Date(payload.required_by_date);
    const slaHours = payload.priority === 'P1' ? 2 : 4;
    requestedDate.setHours(requestedDate.getHours() - slaHours);
    return requestedDate;
  }
}

export const materialsEventSubscriber = new MaterialsEventSubscriber();
```

---

## 📱 DRIVER MOBILE APP

### PWA (Progressive Web App)

**Why PWA?**
- Single codebase for web & mobile
- Offline-first architecture
- No app store approval delays
- Push notifications support
- Access to device camera & GPS
- Add to home screen

### Key Features

#### 1. Offline Capability

```typescript
// services/offlineService.ts
class OfflineService {
  private db: IDBDatabase;
  private syncQueue: SyncQueue[];

  async init() {
    // Open IndexedDB for offline storage
    this.db = await idb.open('logistics-driver', 1, {
      upgrade(db) {
        db.createObjectStore('tasks', { keyPath: 'task_id' });
        db.createObjectStore('pod_photos', { keyPath: 'id' });
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      },
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js');
    }

    // Start sync listener
    this.startSyncListener();
  }

  async cacheTasks(tasks: LogisticsTask[]) {
    const tx = this.db.transaction('tasks', 'readwrite');
    for (const task of tasks) {
      await tx.objectStore('tasks').put(task);
    }
  }

  async queuePODUpload(pod: PODRecord) {
    // Store POD in IndexedDB
    const tx = this.db.transaction('sync_queue', 'readwrite');
    await tx.objectStore('sync_queue').add({
      type: 'pod_upload',
      data: pod,
      timestamp: Date.now(),
    });

    // Try to sync immediately if online
    if (navigator.onLine) {
      await this.syncPendingUploads();
    }
  }

  async syncPendingUploads() {
    const tx = this.db.transaction('sync_queue', 'readonly');
    const queue = await tx.objectStore('sync_queue').getAll();

    for (const item of queue) {
      try {
        if (item.type === 'pod_upload') {
          await api.uploadPOD(item.data);
          // Remove from queue on success
          await this.removeSyncItem(item.id);
        }
      } catch (error) {
        console.error('Sync failed, will retry:', error);
      }
    }
  }

  private startSyncListener() {
    window.addEventListener('online', () => {
      console.log('Back online, syncing...');
      this.syncPendingUploads();
    });
  }
}

export const offlineService = new OfflineService();
```

#### 2. Camera Integration

```typescript
// components/driver/CameraUpload.tsx
import { useState } from 'react';

export function CameraUpload({ onCapture }) {
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }, // Use back camera
    });
    setStream(mediaStream);
  };

  const capturePhoto = () => {
    const video = document.querySelector('video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
    }, 'image/jpeg', 0.8);
  };

  return (
    <div>
      {stream ? (
        <video autoPlay playsInline muted ref={(el) => el && (el.srcObject = stream)} />
      ) : (
        <button onClick={startCamera}>Start Camera</button>
      )}
      <button onClick={capturePhoto}>Capture</button>
    </div>
  );
}
```

#### 3. GPS Tracking

```typescript
// services/gpsService.ts
class GPSService {
  private watchId: number | null = null;
  private currentPosition: GeolocationPosition | null = null;

  startTracking(callback: (position: GeolocationPosition) => void) {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition = position;
        callback(position);
        
        // Send to backend (throttled)
        this.sendLocationUpdate(position);
      },
      (error) => {
        console.error('GPS error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }

  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private throttledSend = throttle(async (position: GeolocationPosition) => {
    await api.updateDriverLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date(position.timestamp).toISOString(),
    });
  }, 30000); // Every 30 seconds

  private sendLocationUpdate(position: GeolocationPosition) {
    this.throttledSend(position);
  }

  getCurrentPosition(): GeolocationPosition | null {
    return this.currentPosition;
  }

  async verifyAtLocation(targetLat: number, targetLng: number, radiusMeters: number): Promise<boolean> {
    if (!this.currentPosition) {
      throw new Error('No GPS position available');
    }

    const distance = this.calculateDistance(
      this.currentPosition.coords.latitude,
      this.currentPosition.coords.longitude,
      targetLat,
      targetLng
    );

    return distance <= radiusMeters;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const gpsService = new GPSService();
```

#### 4. Push Notifications

```typescript
// services/pushNotificationService.ts
class PushNotificationService {
  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    // Subscribe to push notifications
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey),
    });

    // Send subscription to backend
    await api.registerPushSubscription(subscription);
  }

  async sendLocalNotification(title: string, body: string, data: any) {
    if (Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data,
        tag: data.task_id,
        requireInteraction: true,
      });
    }
  }
}

export const pushNotificationService = new PushNotificationService();
```

---

## 📸 POD CAPTURE SYSTEM

### POD Requirements

Per specification:
- **Photos:** Mandatory (exception: MLC/MC notified if missing)
- **Signature:** Optional
- **GPS:** Auto-capture if available, verify within site radius
- **Timestamp:** Automatic
- **Delivery Notes:** Optional text field

### POD Workflow

```
1. Driver completes delivery
2. Opens POD capture screen
3. Takes photos (minimum 1, recommended 3+):
   - Overall view
   - Close-up of materials
   - Delivery location context
4. Optional: Captures signature
   - Signature pad with stylus/finger
   - Prints/types name
5. GPS auto-captured in background
6. Adds delivery notes (optional)
7. Submits POD
8. System validates:
   - At least 1 photo? ✅ or ⚠️
   - GPS within radius? ✅ or ⚠️
   - All data present? ✅
9. If online: Uploads immediately
10. If offline: Queues for sync
11. Notifies MLC/MC of completion
```

### POD Validation Rules

```typescript
// utils/podValidator.ts
interface PODValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export function validatePOD(pod: PODRecord): PODValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Photos (mandatory)
  if (!pod.photos || pod.photos.length === 0) {
    warnings.push('No photos captured. MLC/MC will be notified.');
  }

  // Signature (optional)
  if (!pod.signature_img) {
    // Soft warning only
    console.log('No signature captured (optional)');
  }

  // GPS
  if (!pod.delivery_gps_lat || !pod.delivery_gps_lng) {
    warnings.push('GPS location not available');
  } else {
    // Verify within configured site radius
    const inRadius = gpsService.verifyAtLocation(
      pod.delivery_gps_lat,
      pod.delivery_gps_lng,
      config.siteRadiusMeters
    );
    
    if (!inRadius) {
      warnings.push(`GPS location is ${distance}m from delivery site (expected <${config.siteRadiusMeters}m)`);
    }
  }

  // Delivered to name
  if (!pod.delivered_to || pod.delivered_to.trim() === '') {
    errors.push('Receiver name is required');
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
```

### POD Storage

**Storage Strategy:**
- **Photos:** Supabase Storage or MinIO
- **Signatures:** Base64 string or Storage (if large)
- **Metadata:** PostgreSQL `pod_records` table

```typescript
// services/podService.ts
class PODService {
  async uploadPhoto(file: File): Promise<string> {
    // Generate unique filename
    const filename = `pod-photos/${Date.now()}-${file.name}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('logistics-pod')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Photo upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('logistics-pod')
      .getPublicUrl(filename);

    return urlData.publicUrl;
  }

  async createPOD(taskId: string, podData: Partial<PODRecord>): Promise<PODRecord> {
    // Upload photos
    const photoUrls = [];
    for (const photo of podData.photos || []) {
      if (photo instanceof File) {
        const url = await this.uploadPhoto(photo);
        photoUrls.push({
          id: uuid(),
          url,
          thumbnail_url: url, // TODO: Generate thumbnail
          type: 'delivery',
          caption: photo.name,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Create POD record
    const pod: PODRecord = {
      pod_id: uuid(),
      task_id: taskId,
      signature_img: podData.signature_img,
      signature_name: podData.signature_name,
      signature_timestamp: podData.signature_timestamp,
      photos: photoUrls,
      photo_count: photoUrls.length,
      delivery_gps_lat: podData.delivery_gps_lat,
      delivery_gps_lng: podData.delivery_gps_lng,
      delivery_gps_accuracy: podData.delivery_gps_accuracy,
      gps_verified: podData.gps_verified || false,
      delivered_to: podData.delivered_to,
      delivered_to_phone: podData.delivered_to_phone,
      delivery_notes: podData.delivery_notes,
      verified: false,
      created_at: new Date().toISOString(),
      created_by: auth.currentUser.id,
    };

    // Save to database
    await db.pod_records.insert(pod);

    // Validate and notify if warnings
    const validation = validatePOD(pod);
    if (validation.warnings.length > 0) {
      await notificationService.send({
        recipients: ['mlc-team@example.com'],
        subject: `POD Warning: Task ${taskId}`,
        body: `POD submitted with warnings:\n${validation.warnings.join('\n')}`,
      });
    }

    return pod;
  }

  async verifyPOD(podId: string, notes: string): Promise<void> {
    await db.pod_records.update(
      { pod_id: podId },
      {
        verified: true,
        verified_by: auth.currentUser.id,
        verified_at: new Date().toISOString(),
        verification_notes: notes,
      }
    );
  }
}

export const podService = new PODService();
```

---

## 📊 REPORTING & KPIs

### Key Metrics Dashboard

Per specification, track:

1. **Task Volume**
   - By type (delivery, collection, yard work, etc.)
   - By requester (Materials, Maintenance, Projects, etc.)
   - Trend over time (daily, weekly, monthly)

2. **SLA Compliance**
   - % of tasks completed within SLA
   - Average delay for late tasks
   - Breakdown by type and priority

3. **Exception Rate**
   - # of exceptions per day/week
   - Exception type breakdown
   - Resolution time

4. **Average Turnaround**
   - By site pair (pickup → dropoff)
   - By vehicle type
   - By driver

5. **Fleet Utilization**
   - % of time vehicles active
   - # of tasks per vehicle per day
   - Idle time analysis

6. **POD Completeness**
   - % with photos
   - % with signatures
   - % with GPS verification
   - Average photos per POD

### Reports Implementation

```typescript
// services/reportService.ts
class LogisticsReportService {
  async getTaskVolumeReport(dateRange: DateRange) {
    const tasks = await db.logistics_tasks.find({
      created_at: { $gte: dateRange.start, $lte: dateRange.end },
    });

    // Group by type
    const byType = tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {});

    // Group by requester
    const byRequester = tasks.reduce((acc, task) => {
      const dept = task.requester.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    return { byType, byRequester, total: tasks.length };
  }

  async getSLAComplianceReport(dateRange: DateRange) {
    const tasks = await db.logistics_tasks.find({
      completed_at: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const onTime = tasks.filter(t => t.completed_at <= t.sla_target_at);
    const late = tasks.filter(t => t.completed_at > t.sla_target_at);

    const complianceRate = (onTime.length / tasks.length) * 100;

    const avgDelay = late.reduce((sum, t) => {
      const delay = new Date(t.completed_at).getTime() - new Date(t.sla_target_at).getTime();
      return sum + delay;
    }, 0) / late.length;

    return {
      total: tasks.length,
      onTime: onTime.length,
      late: late.length,
      complianceRate,
      avgDelayMs: avgDelay,
      avgDelayHours: avgDelay / (1000 * 60 * 60),
    };
  }

  async getExceptionReport(dateRange: DateRange) {
    const events = await db.task_events.find({
      event_type: 'exception',
      timestamp: { $gte: dateRange.start, $lte: dateRange.end },
    });

    // Group by exception type
    const byType = events.reduce((acc, event) => {
      const type = event.event_data?.exception_type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      total: events.length,
      byType,
      rate: (events.length / tasks.length) * 100, // Exception rate
    };
  }

  async getFleetUtilizationReport(dateRange: DateRange) {
    const vehicles = await db.vehicles.find({ status: { $ne: 'out_of_service' } });

    const utilization = [];
    for (const vehicle of vehicles) {
      const tasks = await db.logistics_tasks.find({
        vehicle_id: vehicle.vehicle_id,
        completed_at: { $gte: dateRange.start, $lte: dateRange.end },
      });

      const totalTime = tasks.reduce((sum, t) => {
        const duration = new Date(t.completed_at).getTime() - new Date(t.started_at).getTime();
        return sum + duration;
      }, 0);

      const totalDays = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
      const utilizationRate = (totalTime / (totalDays * 24 * 60 * 60 * 1000)) * 100;

      utilization.push({
        vehicle: vehicle.registration,
        tasks: tasks.length,
        totalHours: totalTime / (1000 * 60 * 60),
        utilizationRate,
      });
    }

    return utilization;
  }

  async exportToCSV(reportData: any, filename: string): Promise<string> {
    // Convert to CSV format
    const csv = jsonToCSV(reportData);
    
    // Upload to storage
    const { data, error } = await supabase.storage
      .from('logistics-reports')
      .upload(`${filename}.csv`, csv, {
        contentType: 'text/csv',
      });

    if (error) {
      throw new Error(`Export failed: ${error.message}`);
    }

    // Return download URL
    const { data: urlData } = supabase.storage
      .from('logistics-reports')
      .getPublicUrl(`${filename}.csv`);

    return urlData.publicUrl;
  }

  async exportToPDF(reportData: any, filename: string): Promise<string> {
    // Generate PDF (use library like jsPDF or server-side PDF generator)
    // ... implementation ...
  }
}

export const logisticsReportService = new LogisticsReportService();
```

---

## ⚙️ MLC CONFIGURATION PANEL

### Configuration Architecture

Following the MC Backend spec pattern, create a mirror configuration system for MLC.

#### Configuration Categories

1. **Request Types & SLAs**
   - Add/edit/delete request types
   - Set SLA targets per type
   - Configure form fields per type
   - Enable/disable types

2. **Site Zones & Geofences**
   - Define pickup/dropoff locations
   - Set GPS coordinates and radius
   - Configure access requirements
   - Link contact persons

3. **Drivers & Vehicles**
   - Register drivers (name, license, phone)
   - Register vehicles (registration, type, capacity)
   - Assign vehicles to drivers
   - Track maintenance schedules

4. **Notification Rules**
   - Configure who gets notified when
   - Set escalation rules
   - Template management
   - Channel settings (email, SMS, Teams)

5. **Integration Settings**
   - Materials app sync rules
   - External API endpoints
   - Webhook configurations
   - API key management

6. **Feature Toggles**
   - Enable/disable features without code changes
   - E.g., offline mode, GPS tracking, push notifications

### Config Storage

All config stored in `logistics_config` table:

```typescript
// Example config records
const configExamples = [
  {
    config_key: 'request_type.delivery',
    config_type: 'request_type',
    config_value: {
      name: 'Delivery / Collection',
      sla_hours: 4,
      form_fields: ['pickup', 'dropoff', 'load_info', 'requested_date'],
      enabled: true,
    },
  },
  {
    config_key: 'site_zone.warehouse_bay_3',
    config_type: 'site_zone',
    config_value: {
      name: 'Warehouse Bay 3',
      gps_lat: -26.123456,
      gps_lng: 152.789012,
      radius_meters: 50,
      access: 'Badge required',
      contact: 'John Smith',
      contact_phone: '+61-XXX-XXX',
    },
  },
  {
    config_key: 'notification_rule.task_assigned',
    config_type: 'notification_rule',
    config_value: {
      event: 'task_assigned',
      enabled: true,
      channels: ['email', 'sms', 'push'],
      recipients: ['driver'],
      template_id: 'task_assigned_template',
    },
  },
];
```

### Config UI Components

```tsx
// components/mlc/RequestTypeManager.tsx
export function RequestTypeManager() {
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);

  return (
    <div className="space-y-4">
      <h2>Request Types & SLAs</h2>
      
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>SLA</th>
            <th>Enabled</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requestTypes.map(type => (
            <tr key={type.id}>
              <td>{type.name}</td>
              <td>{type.sla_hours} hours</td>
              <td>{type.enabled ? '✅' : '❌'}</td>
              <td>
                <button onClick={() => editRequestType(type)}>Edit</button>
                <button onClick={() => deleteRequestType(type)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <button onClick={() => openAddModal()}>+ Add Request Type</button>
    </div>
  );
}
```

---

## 🗓️ IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Set up database, API skeleton, basic auth

- [ ] Create database schema (all tables)
- [ ] Set up Row-Level Security policies
- [ ] Create API endpoints (stubs)
- [ ] Implement authentication (Supabase Auth)
- [ ] Set up role-based access control
- [ ] Create basic frontend shell (routing)

**Deliverable:** Empty app with auth + database ready

---

### Phase 2: Task Management (Weeks 3-4)

**Goal:** Core CRUD for tasks

- [ ] Implement task creation form
- [ ] Task list view (dispatcher)
- [ ] Task detail view
- [ ] Task assignment logic
- [ ] Status transitions (state machine)
- [ ] SLA calculation service
- [ ] Task queue with sorting

**Deliverable:** MLC can create, view, assign tasks

---

### Phase 3: Driver App (Weeks 5-6)

**Goal:** Mobile-optimized driver interface

- [ ] Driver task list view
- [ ] Task detail for drivers
- [ ] Start/arrive/complete buttons
- [ ] GPS tracking integration
- [ ] Camera integration for photos
- [ ] Signature pad
- [ ] Offline storage (IndexedDB)
- [ ] Sync service

**Deliverable:** Drivers can execute tasks on mobile

---

### Phase 4: POD System (Week 7)

**Goal:** Proof of Delivery capture and verification

- [ ] POD capture flow
- [ ] Photo upload to storage
- [ ] Signature capture
- [ ] GPS verification
- [ ] POD validation rules
- [ ] MLC verification UI
- [ ] Notification on POD warnings

**Deliverable:** Complete POD workflow end-to-end

---

### Phase 5: Materials Integration (Week 8)

**Goal:** Event-driven sync with Materials app

- [ ] Set up Redis Streams publisher
- [ ] Set up Redis Streams subscriber
- [ ] Implement event handlers (MRF → Task)
- [ ] Implement event publishers (Task → MRF)
- [ ] Test bidirectional sync
- [ ] Error handling & retry logic
- [ ] Dead letter queue monitoring

**Deliverable:** Materials + Logistics apps communicate via events

---

### Phase 6: Reporting (Week 9)

**Goal:** KPI dashboards and exports

- [ ] Task volume report
- [ ] SLA compliance report
- [ ] Exception report
- [ ] Fleet utilization report
- [ ] Driver performance report
- [ ] POD completeness report
- [ ] CSV export
- [ ] PDF export
- [ ] Automated daily email reports

**Deliverable:** MLC has full reporting suite

---

### Phase 7: Configuration (Week 10)

**Goal:** MLC god-mode control panel

- [ ] Request type management
- [ ] Site zone management
- [ ] Driver/vehicle registry
- [ ] Notification rules
- [ ] Integration settings
- [ ] Feature toggles
- [ ] Import/export config

**Deliverable:** MLC can configure everything

---

### Phase 8: Polish & Testing (Weeks 11-12)

**Goal:** Production-ready

- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests (API + Events)
- [ ] E2E tests (critical flows)
- [ ] Performance optimization
- [ ] Mobile responsiveness check
- [ ] Offline mode testing
- [ ] Security audit
- [ ] User acceptance testing (UAT)
- [ ] Documentation
- [ ] Training materials

**Deliverable:** Production-ready Logistics App

---

## 🧪 TESTING STRATEGY

### Unit Tests

```typescript
// __tests__/services/taskService.test.ts
describe('TaskService', () => {
  describe('createTask', () => {
    it('should create task with valid data', async () => {
      const task = await taskService.createTask({
        type: 'delivery',
        requester: { name: 'Test User', department: 'Engineering' },
        pickup: { location: 'Warehouse' },
        dropoff: { location: 'Unit 12' },
        requested_date: new Date(),
      });

      expect(task.task_id).toBeDefined();
      expect(task.status).toBe('new');
    });

    it('should calculate SLA correctly for P1 tasks', async () => {
      const requestedDate = new Date('2025-10-10 14:00:00');
      const task = await taskService.createTask({
        priority: 'critical',
        requested_date: requestedDate,
        // ... other fields
      });

      // P1 SLA = 2 hours
      const expectedSLA = new Date('2025-10-10 16:00:00');
      expect(task.sla_target_at).toEqual(expectedSLA);
    });
  });

  describe('assignDriver', () => {
    it('should assign driver and vehicle to task', async () => {
      const task = await taskService.assignDriver(taskId, driverId, vehicleId);
      expect(task.driver_id).toBe(driverId);
      expect(task.vehicle_id).toBe(vehicleId);
      expect(task.assigned_at).toBeDefined();
    });

    it('should throw error if driver already assigned', async () => {
      await expect(
        taskService.assignDriver(taskId, busyDriverId, vehicleId)
      ).rejects.toThrow('Driver already assigned to another task');
    });
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/events.test.ts
describe('Materials → Logistics Event Flow', () => {
  it('should create logistics task when MRF ready', async () => {
    // Publish MRF ready event
    await materialsEventPublisher.publish({
      type: 'mrf.ready_for_collection',
      payload: {
        mrf_id: 'MRF-1234',
        pickup: { location: 'Warehouse Bay 3' },
        dropoff: { location: 'Unit 12' },
        priority: 'P1',
        requester: { name: 'Jane Doe' },
      },
    });

    // Wait for event processing
    await sleep(1000);

    // Check task was created
    const task = await db.logistics_tasks.findOne({ linked_mrf_id: 'MRF-1234' });
    expect(task).toBeDefined();
    expect(task.type).toBe('delivery');
    expect(task.priority).toBe('critical');
  });

  it('should notify Materials app when task delivered', async () => {
    // Complete task with POD
    await taskService.completeTask(taskId, {
      pod: { /* POD data */ },
    });

    // Wait for event publishing
    await sleep(1000);

    // Check event was published
    const events = await redis.xread('STREAMS', 'events:logistics', '0');
    const deliveryEvent = events.find(e => e.type === 'logistics.task.delivered');
    expect(deliveryEvent).toBeDefined();
    expect(deliveryEvent.payload.mrf_id).toBe('MRF-1234');
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/driver-flow.spec.ts
test.describe('Driver Task Execution', () => {
  test('should complete full task flow', async ({ page }) => {
    // Login as driver
    await page.goto('/login');
    await page.fill('[name=email]', 'driver@example.com');
    await page.fill('[name=password]', 'password');
    await page.click('button[type=submit]');

    // Navigate to assigned tasks
    await page.click('text=My Tasks');
    await expect(page).toHaveURL('/driver/my-tasks');

    // Click on first task
    await page.click('.task-card:first-child');

    // Start task
    await page.click('button:has-text("Start Task")');
    await expect(page.locator('.status-badge')).toHaveText('In Progress');

    // Arrive at pickup
    await page.click('button:has-text("Arrived at Pickup")');

    // Complete pickup
    await page.click('button:has-text("Complete Pickup")');

    // Arrive at dropoff
    await page.click('button:has-text("Arrived at Dropoff")');

    // Capture POD
    await page.click('button:has-text("Capture POD")');
    
    // Take photo (mock camera)
    await page.click('button:has-text("Take Photo")');
    await page.click('button:has-text("Use Photo")');

    // Add signature
    // (Draw on canvas - complex, may mock)
    
    // Submit POD
    await page.fill('[name=delivered_to]', 'Jane Doe');
    await page.click('button:has-text("Submit POD")');

    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.status-badge')).toHaveText('Completed');
  });
});
```

---

## 📚 TECHNICAL SPECIFICATIONS SUMMARY

### Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend | React 18 + TypeScript | Component reusability, type safety |
| Routing | Next.js App Router | SSR, API routes, file-based routing |
| Styling | Tailwind CSS | Rapid UI development, consistency |
| State | React Query + Zustand | Server state + client state |
| Database | PostgreSQL (Supabase) | Relational data, RLS, real-time |
| Auth | Supabase Auth | Built-in, JWT, RLS integration |
| Storage | Supabase Storage / MinIO | POD photos, signatures |
| Events | Redis Streams | Event-driven integration (ADR-002) |
| API | Supabase Edge Functions / Next.js API | Serverless, co-located with frontend |
| Offline | IndexedDB + Service Worker | PWA offline-first |
| Testing | Jest + Playwright | Unit + E2E coverage |
| Deployment | Vercel / Docker | CI/CD, monorepo support |

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load time | <2s (p95) | Lighthouse |
| API response time | <500ms (p95) | APM |
| Event delivery time | <10s (p99) | Redis monitoring |
| Offline sync time | <30s | Manual test |
| Photo upload time | <5s | Manual test |
| GPS accuracy | <50m | Device API |

### Security Checklist

- [ ] All API endpoints use RLS policies
- [ ] JWT tokens short-lived (<1 hour)
- [ ] Refresh tokens httpOnly + secure
- [ ] Rate limiting on API routes
- [ ] Input validation (Zod schemas)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (React escapes by default)
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Secrets in environment variables (not code)
- [ ] Audit logging enabled
- [ ] POD photos/signatures immutable (signed URLs)

---

## 🎯 ACCEPTANCE CRITERIA

### AC-01: Requester can create any task type via form ✅

**Given:** A logged-in user with Requester role  
**When:** They navigate to "Create Task" and fill in the form  
**Then:** Task is created and appears in queue  
**And:** Requester receives confirmation notification

### AC-02: Dispatcher assigns and driver receives within 10s ✅

**Given:** MLC assigns a task to Driver A  
**When:** Assignment is saved  
**Then:** Driver A sees new task in their list within 10 seconds  
**And:** Driver A receives push notification

### AC-03: Status update syncs to linked MRF if applicable ✅

**Given:** A logistics task linked to MRF-1234  
**When:** Driver marks task as "Delivered"  
**Then:** MRF-1234 status updates to "Delivered" in Materials app within 10 seconds  
**And:** POD data is attached to MRF

### AC-04: POD capture offline, auto-sync on reconnect ✅

**Given:** Driver is offline (airplane mode)  
**When:** Driver captures POD (photos + signature)  
**Then:** POD is stored in IndexedDB  
**And:** When online, POD syncs automatically within 30 seconds  
**And:** MLC receives notification of POD completion

---

## ✅ CHECKLIST BEFORE IMPLEMENTATION

Before starting build, ensure:

- [ ] Database schema reviewed and approved
- [ ] API endpoints defined and approved
- [ ] Frontend component structure approved
- [ ] Event contracts with Materials app agreed
- [ ] Authentication roles and permissions defined
- [ ] POD requirements clarified (photos mandatory, signature optional)
- [ ] SLA rules per request type defined
- [ ] GPS radius tolerance configured
- [ ] Notification rules defined
- [ ] Offline sync strategy validated
- [ ] Testing strategy approved
- [ ] Deployment plan defined

---

## 📞 QUESTIONS FOR STAKEHOLDER

Before implementation, clarify:

1. **Request Types:** What are the initial request types? (Delivery, Collection, Yard Work, etc.)
2. **SLA Targets:** What are the SLA hours for each type?
3. **GPS Radius:** What is acceptable GPS radius for POD verification? (50m, 100m, 200m?)
4. **Photo Requirements:** How many photos minimum? Maximum?
5. **Signature:** Always optional, or mandatory for certain types?
6. **Driver Assignment:** Auto-assign based on availability, or always manual?
7. **Priority Levels:** Use same P1-P4 as Materials, or different scale?
8. **Notifications:** Who gets notified when? (Email, SMS, Teams, Push?)
9. **Approvals:** Any approval chain for certain request types?
10. **Integration:** Any other systems besides Materials app? (Maintenance, Projects?)

---

**END OF PLANNING DOCUMENT**

---

## 📝 NEXT STEPS

1. **Review this plan with stakeholders**
2. **Get sign-off on architecture and scope**
3. **Clarify open questions above**
4. **Set up development environment**
5. **Begin Phase 1: Foundation**

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-09  
**Author:** AI Development Team  
**Status:** 🟡 Planning Phase - Awaiting Approval
