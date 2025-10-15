# SCM Hub - Dataverse Entity Schemas

This document outlines the detailed Microsoft Dataverse entity schemas for migrating the SCM Hub application to PowerApps.

## Core Entity Design Principles

- **Prefix**: All custom entities use `scm_` prefix
- **Naming Convention**: PascalCase for display names, camelCase for schema names
- **Relationships**: Proper foreign keys and lookup fields
- **Business Rules**: Validation, automation, and conditional logic
- **Security**: Field-level security and role-based access

---

## 1. SCM Material Request Entity (`scm_materialrequest`)

**Primary Entity** - Core of the material request workflow

### Fields

| Schema Name | Display Name | Type | Required | Business Logic |
|-------------|--------------|------|----------|----------------|
| `scm_materialrequestid` | Material Request ID | Primary Key (GUID) | Yes | Auto-generated |
| `scm_requestnumber` | Request Number | Single Line of Text | Yes | Auto-increment format: MRF-YYYY-NNNN |
| `scm_status` | Status | Choice | Yes | Default: "Submitted" |
| `scm_priority` | Priority | Choice | Yes | Default: "P3" |
| `scm_items` | Item Count | Whole Number | Yes | Calculated from related items |
| `scm_workorders` | Work Orders | Multiple Lines of Text | Yes | Comma-separated work order numbers |
| `scm_createddate` | Created Date | Date and Time | Yes | Default: Today |
| `scm_requiredby` | Required By | Date and Time | Yes | Must be future date |
| `scm_requestedby` | Requested By | Lookup (User) | Yes | Default: Current user |
| `scm_mcpriorityflag` | MC Priority Flag | Two Options | No | Default: No |
| `scm_deliverylocation` | Delivery Location | Lookup (Delivery Location) | Yes | |
| `scm_requestorname` | Requestor Name | Single Line of Text | Yes | |
| `scm_acpriority` | AC Priority | Decimal Number | No | 1-10 scale |
| `scm_mcqueueposition` | MC Queue Position | Whole Number | No | Auto-calculated |
| `scm_estimateddelivery` | Estimated Delivery | Date and Time | No | |
| `scm_tolltaskid` | Toll Task ID | Single Line of Text | No | External system reference |
| `scm_tollstatus` | Toll Status | Choice | No | Default: "pending" |

### Choice Fields

**Status Options:**
- Submitted
- Picking
- Partial Pick - Open
- Partial Pick - Closed
- Staged
- In Transit
- Delivered
- On Hold
- Cancelled

**Priority Options:**
- P1 (Critical)
- P2 (High)
- P3 (Normal)
- P4 (Low)

**Toll Status Options:**
- pending
- accepted
- in_transit
- delivered
- cancelled
- failed

### Business Rules

1. **Status Validation**: Cannot move backwards unless authorized
2. **Priority Logic**: P1 requests auto-assign MC Priority Flag
3. **SLA Calculation**: Auto-calculate estimated delivery based on priority
4. **Queue Position**: Auto-update when priority or status changes

---

## 2. SCM Delivery Location Entity (`scm_deliverylocation`)

**Reference Entity** - Delivery locations and contact information

### Fields

| Schema Name | Display Name | Type | Required | Business Logic |
|-------------|--------------|------|----------|----------------|
| `scm_deliverylocationid` | Delivery Location ID | Primary Key (GUID) | Yes | Auto-generated |
| `scm_locationcode` | Location Code | Single Line of Text | Yes | Format: LOC### |
| `scm_building` | Building | Single Line of Text | Yes | |
| `scm_floor` | Floor | Single Line of Text | No | |
| `scm_room` | Room | Single Line of Text | No | |
| `scm_fulladdress` | Full Address | Single Line of Text | Yes | Auto-calculated |
| `scm_contactperson` | Contact Person | Single Line of Text | No | |
| `scm_contactphone` | Contact Phone | Phone | No | |
| `scm_deliveryinstructions` | Delivery Instructions | Multiple Lines of Text | No | |
| `scm_isactive` | Is Active | Two Options | Yes | Default: Yes |
| `scm_gpslatitude` | GPS Latitude | Decimal Number | No | |
| `scm_gpslongitude` | GPS Longitude | Decimal Number | No | |

### Business Rules

1. **Full Address**: Auto-generate from Building + Floor + Room
2. **Location Code**: Auto-generate sequential codes (LOC001, LOC002, etc.)
3. **GPS Validation**: Validate latitude/longitude ranges if provided

---

## 3. SCM Request Item Entity (`scm_requestitem`)

**Detail Entity** - Individual items within material requests

### Fields

| Schema Name | Display Name | Type | Required | Business Logic |
|-------------|--------------|------|----------|----------------|
| `scm_requestitemid` | Request Item ID | Primary Key (GUID) | Yes | Auto-generated |
| `scm_materialrequest` | Material Request | Lookup (Material Request) | Yes | |
| `scm_pkey` | P Key | Single Line of Text | Yes | Unique identifier |
| `scm_status` | Status | Choice | Yes | Default: "Open" |
| `scm_qtyrequested` | Quantity Requested | Decimal Number | Yes | Must be > 0 |
| `scm_materialdescription` | Material Description | Single Line of Text | Yes | |
| `scm_itemnumber` | Item Number | Single Line of Text | Yes | |
| `scm_storagelocation` | Storage Location | Single Line of Text | No | |
| `scm_packnumber` | Pack Number | Single Line of Text | No | |
| `scm_shortreason` | Short Reason | Choice | No | |
| `scm_shortnotes` | Short Notes | Multiple Lines of Text | No | |
| `scm_shortreportedby` | Short Reported By | Lookup (User) | No | |
| `scm_shortreportedat` | Short Reported At | Date and Time | No | |

### Choice Fields

**Status Options:**
- Open
- Picked
- Short

**Short Reason Options:**
- Item Damaged
- Quantity Mismatch
- Location Empty
- Wrong Item in Location
- Quarantine
- Other

### Business Rules

1. **Status Logic**: Can only mark as "Short" if reason provided
2. **Reporting**: Auto-populate reporter and timestamp when marked short
3. **Validation**: Cannot have duplicate P Keys within same request

---

## 4. SCM Logistics Task Entity (`scm_logisticstask`)

**Primary Entity** - Delivery and logistics task management

### Fields

| Schema Name | Display Name | Type | Required | Business Logic |
|-------------|--------------|------|----------|----------------|
| `scm_logisticstaskid` | Logistics Task ID | Primary Key (GUID) | Yes | Auto-generated |
| `scm_tasknumber` | Task Number | Single Line of Text | Yes | Auto-increment format: LT-YYYY-NNNN |
| `scm_type` | Task Type | Choice | Yes | |
| `scm_category` | Category | Single Line of Text | No | |
| `scm_priority` | Priority | Choice | Yes | Default: "normal" |
| `scm_description` | Description | Multiple Lines of Text | Yes | |
| `scm_specialinstructions` | Special Instructions | Multiple Lines of Text | No | |
| `scm_linkedmrfid` | Linked MRF ID | Lookup (Material Request) | No | |
| `scm_linkedwoid` | Linked Work Order | Single Line of Text | No | |
| `scm_requester` | Requester | Lookup (User) | Yes | Default: Current user |
| `scm_department` | Department | Single Line of Text | Yes | |
| `scm_costcentre` | Cost Centre | Single Line of Text | No | |
| `scm_pickuplocation` | Pickup Location | Single Line of Text | Yes | |
| `scm_pickupsitegate` | Pickup Site Gate | Single Line of Text | No | |
| `scm_pickupcontact` | Pickup Contact | Single Line of Text | No | |
| `scm_pickupphone` | Pickup Phone | Phone | No | |
| `scm_dropofflocation` | Dropoff Location | Single Line of Text | Yes | |
| `scm_dropoffsitegate` | Dropoff Site Gate | Single Line of Text | No | |
| `scm_dropoffcontact` | Dropoff Contact | Single Line of Text | No | |
| `scm_dropoffphone` | Dropoff Phone | Phone | No | |
| `scm_requesteddate` | Requested Date | Date and Time | Yes | |
| `scm_requestedtime` | Requested Time | Date and Time | No | |
| `scm_hardwindowflag` | Hard Window Flag | Two Options | No | Default: No |
| `scm_slatarget` | SLA Target | Date and Time | No | Auto-calculated |
| `scm_status` | Status | Choice | Yes | Default: "new" |
| `scm_statusreason` | Status Reason | Single Line of Text | No | |
| `scm_driver` | Driver | Lookup (Driver) | No | |
| `scm_vehicle` | Vehicle | Lookup (Vehicle) | No | |
| `scm_assignedat` | Assigned At | Date and Time | No | |
| `scm_assignedby` | Assigned By | Lookup (User) | No | |
| `scm_startedat` | Started At | Date and Time | No | |
| `scm_pickuparrivedat` | Pickup Arrived At | Date and Time | No | |
| `scm_pickupcompletedat` | Pickup Completed At | Date and Time | No | |
| `scm_dropoffarrivedat` | Dropoff Arrived At | Date and Time | No | |
| `scm_completedat` | Completed At | Date and Time | No | |
| `scm_verifiedat` | Verified At | Date and Time | No | |
| `scm_verifiedby` | Verified By | Lookup (User) | No | |
| `scm_closedat` | Closed At | Date and Time | No | |
| `scm_closedby` | Closed By | Lookup (User) | No | |

### Choice Fields

**Task Type Options:**
- delivery
- collection
- container_move
- yard_work
- project_move
- backload
- adhoc

**Priority Options:**
- critical
- high
- normal
- low

**Status Options:**
- new
- scheduled
- in_progress
- completed
- verified
- closed
- exception
- cancelled
- on_hold

### Business Rules

1. **Status Progression**: Enforce logical status transitions
2. **Assignment Logic**: Auto-assign based on driver availability and task priority
3. **SLA Calculation**: Auto-calculate SLA target based on priority and type
4. **Completion Validation**: Require POD before marking as completed

---

## 5. SCM Driver Entity (`scm_driver`)

**Reference Entity** - Driver information and status

### Fields

| Schema Name | Display Name | Type | Required | Business Logic |
|-------------|--------------|------|----------|----------------|
| `scm_driverid` | Driver ID | Primary Key (GUID) | Yes | Auto-generated |
| `scm_userid` | User ID | Lookup (User) | No | Link to Azure AD |
| `scm_name` | Name | Single Line of Text | Yes | |
| `scm_email` | Email | Email | No | |
| `scm_phone` | Phone | Phone | Yes | |
| `scm_employeeid` | Employee ID | Single Line of Text | No | |
| `scm_licensenumber` | License Number | Single Line of Text | No | |
| `scm_licenseclass` | License Class | Single Line of Text | No | |
| `scm_licenseexpiry` | License Expiry | Date Only | No | |
| `scm_status` | Status | Choice | Yes | Default: "active" |
| `scm_availability` | Availability | Two Options | Yes | Default: Yes |
| `scm_currenttask` | Current Task | Lookup (Logistics Task) | No | |
| `scm_currentlat` | Current Latitude | Decimal Number | No | |
| `scm_currentlng` | Current Longitude | Decimal Number | No | |
| `scm_currentaccuracy` | Current Accuracy | Decimal Number | No | |
| `scm_locationtimestamp` | Location Timestamp | Date and Time | No | |
| `scm_taskscompleted` | Tasks Completed | Whole Number | Yes | Default: 0 |
| `scm_tasksinprogress` | Tasks In Progress | Whole Number | Yes | Default: 0 |
| `scm_avgcompletiontime` | Avg Completion Time | Duration | No | |
| `scm_rating` | Rating | Decimal Number | No | 1-5 scale |

### Choice Fields

**Status Options:**
- active
- inactive
- on_leave
- suspended

### Business Rules

1. **License Validation**: Check license expiry and alert if expired
2. **Availability Logic**: Cannot assign tasks to unavailable drivers
3. **Location Tracking**: Update location when GPS coordinates change
4. **Rating Calculation**: Auto-calculate average rating from completed tasks

---

## 6. SCM Vehicle Entity (`scm_vehicle`)

**Reference Entity** - Vehicle information and maintenance

### Fields

| Schema Name | Display Name | Type | Required | Business Logic |
|-------------|--------------|------|----------|----------------|
| `scm_vehicleid` | Vehicle ID | Primary Key (GUID) | Yes | Auto-generated |
| `scm_registration` | Registration | Single Line of Text | Yes | Unique |
| `scm_make` | Make | Single Line of Text | No | |
| `scm_model` | Model | Single Line of Text | No | |
| `scm_year` | Year | Whole Number | No | |
| `scm_type` | Vehicle Type | Choice | Yes | |
| `scm_maxweightkg` | Max Weight (kg) | Decimal Number | No | |
| `scm_maxvolumem3` | Max Volume (m³) | Decimal Number | No | |
| `scm_equipment` | Equipment | Multiple Lines of Text | No | JSON format |
| `scm_status` | Status | Choice | Yes | Default: "available" |
| `scm_currentdriver` | Current Driver | Lookup (Driver) | No | |
| `scm_currentlat` | Current Latitude | Decimal Number | No | |
| `scm_currentlng` | Current Longitude | Decimal Number | No | |
| `scm_currentaccuracy` | Current Accuracy | Decimal Number | No | |
| `scm_locationtimestamp` | Location Timestamp | Date and Time | No | |
| `scm_lastservicedate` | Last Service Date | Date Only | No | |
| `scm_nextservicedate` | Next Service Date | Date Only | No | |
| `scm_servicenotes` | Service Notes | Multiple Lines of Text | No | |
| `scm_totaltasks` | Total Tasks | Whole Number | Yes | Default: 0 |
| `scm_totaldistancekm` | Total Distance (km) | Decimal Number | Yes | Default: 0 |

### Choice Fields

**Vehicle Type Options:**
- truck
- van
- forklift
- crane
- ute
- other

**Status Options:**
- available
- in_use
- maintenance
- out_of_service

### Business Rules

1. **Registration Uniqueness**: Ensure unique registration numbers
2. **Service Alerts**: Alert when service due
3. **Status Logic**: Cannot assign to vehicles under maintenance
4. **Capacity Validation**: Check weight/volume limits when assigning loads

---

## 7. SCM Proof of Delivery Entity (`scm_proofofdelivery`)

**Detail Entity** - POD records and verification

### Fields

| Schema Name | Display Name | Type | Required | Business Logic |
|-------------|--------------|------|----------|----------------|
| `scm_proofofdeliveryid` | POD ID | Primary Key (GUID) | Yes | Auto-generated |
| `scm_logisticstask` | Logistics Task | Lookup (Logistics Task) | Yes | |
| `scm_materialrequest` | Material Request | Lookup (Material Request) | No | |
| `scm_signatureimg` | Signature Image | Image | No | Base64 encoded |
| `scm_signaturename` | Signature Name | Single Line of Text | No | |
| `scm_signaturetimestamp` | Signature Timestamp | Date and Time | No | |
| `scm_photocount` | Photo Count | Whole Number | Yes | Default: 0 |
| `scm_deliverygpslat` | Delivery GPS Latitude | Decimal Number | No | |
| `scm_deliverygpslng` | Delivery GPS Longitude | Decimal Number | No | |
| `scm_deliverygpsaccuracy` | Delivery GPS Accuracy | Decimal Number | No | |
| `scm_gpsverified` | GPS Verified | Two Options | No | Default: No |
| `scm_gpsverificationnotes` | GPS Verification Notes | Multiple Lines of Text | No | |
| `scm_deliveredto` | Delivered To | Single Line of Text | No | |
| `scm_deliveredtophone` | Delivered To Phone | Phone | No | |
| `scm_deliverynotes` | Delivery Notes | Multiple Lines of Text | No | |
| `scm_verified` | Verified | Two Options | Yes | Default: No |
| `scm_verifiedby` | Verified By | Lookup (User) | No | |
| `scm_verifiedat` | Verified At | Date and Time | No | |
| `scm_verificationnotes` | Verification Notes | Multiple Lines of Text | No | |
| `scm_exceptionflag` | Exception Flag | Two Options | No | Default: No |
| `scm_exceptionreason` | Exception Reason | Multiple Lines of Text | No | |

### Business Rules

1. **GPS Verification**: Validate delivery location against task coordinates
2. **Photo Requirements**: Require minimum number of photos for certain task types
3. **Verification Logic**: Require verification for high-value deliveries
4. **Exception Handling**: Auto-flag exceptions based on GPS variance

---

## 8. SCM Status History Entity (`scm_statushistory`)

**Audit Entity** - Track all status changes and transitions

### Fields

| Schema Name | Display Name | Type | Required | Business Logic |
|-------------|--------------|------|----------|----------------|
| `scm_statushistoryid` | Status History ID | Primary Key (GUID) | Yes | Auto-generated |
| `scm_materialrequest` | Material Request | Lookup (Material Request) | No | |
| `scm_logisticstask` | Logistics Task | Lookup (Logistics Task) | No | |
| `scm_statusfrom` | Status From | Single Line of Text | No | |
| `scm_statusto` | Status To | Single Line of Text | Yes | |
| `scm_changedby` | Changed By | Lookup (User) | Yes | Default: Current user |
| `scm_changedat` | Changed At | Date and Time | Yes | Default: Now |
| `scm_reason` | Reason | Multiple Lines of Text | No | |
| `scm_isbackwards` | Is Backwards | Two Options | Yes | Default: No |
| `scm_gpslat` | GPS Latitude | Decimal Number | No | |
| `scm_gpslng` | GPS Longitude | Decimal Number | No | |
| `scm_notes` | Notes | Multiple Lines of Text | No | |

### Business Rules

1. **Audit Trail**: Auto-create record for every status change
2. **Backwards Tracking**: Flag unauthorized backwards transitions
3. **GPS Logging**: Capture location for mobile status changes
4. **Reason Validation**: Require reason for certain status transitions

---

## Entity Relationships

### Primary Relationships

1. **Material Request** → **Request Items** (1:N)
   - One request can have many items
   - Cascade delete items when request is deleted

2. **Material Request** → **Delivery Location** (N:1)
   - Many requests can use same delivery location
   - Prevent delete if location has active requests

3. **Logistics Task** → **Material Request** (N:1)
   - Many tasks can be linked to one request
   - Optional relationship for standalone tasks

4. **Logistics Task** → **Driver** (N:1)
   - Many tasks can be assigned to one driver
   - Set to null when driver is unavailable

5. **Logistics Task** → **Vehicle** (N:1)
   - Many tasks can use same vehicle
   - Track vehicle utilization

6. **Logistics Task** → **Proof of Delivery** (1:1)
   - One task can have one POD record
   - Create POD when task is completed

7. **Any Entity** → **Status History** (1:N)
   - All entities can have multiple status history records
   - Auto-create on status changes

### Security Roles

1. **SCM Requestor** - Can create and view own requests
2. **SCM Area Coordinator** - Can view and prioritize requests
3. **SCM Qube User** - Can view and process picking tasks
4. **SCM Material Coordinator** - Can manage all requests and queue
5. **SCM Logistics Coordinator** - Can manage logistics tasks
6. **SCM Driver** - Can view assigned tasks and update POD
7. **SCM Administrator** - Full access to all entities

### Calculated Fields

1. **Material Request Items Count** - Count of related request items
2. **Material Request Total Value** - Sum of item values (if available)
3. **Driver Utilization** - Percentage of time assigned to tasks
4. **Vehicle Utilization** - Percentage of time in use
5. **SLA Compliance** - Percentage of tasks completed within SLA

This entity design provides a solid foundation for your PowerApps migration while maintaining all the functionality of your current SCM Hub system.
