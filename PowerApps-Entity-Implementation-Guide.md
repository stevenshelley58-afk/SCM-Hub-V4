# PowerApps Entity Implementation Guide

## Prerequisites

Before implementing these entities in your Microsoft Dataverse environment, ensure you have:

1. **Power Platform Admin Center Access**
   - Environment with Dataverse database
   - Customizer or System Administrator role

2. **Required Permissions**
   - Create custom entities
   - Create relationships
   - Configure business rules
   - Set up security roles

## Implementation Steps

### Phase 1: Core Entities Setup

#### 1.1 Create Base Entities

**Step 1: Create SCM Delivery Location Entity**
1. Go to Power Platform Admin Center → Environments → [Your Environment]
2. Navigate to Solutions → Create new solution "SCM Hub Core"
3. Add new Entity: "Delivery Location"
4. Configure fields as per schema
5. Set primary field to "Location Code"
6. Enable for mobile and web
7. Create business rules for auto-calculation

**Step 2: Create SCM User Profile Entity**
1. Add entity to solution
2. Configure relationship with System User
3. Set up role-based fields
4. Enable for all user types

#### 1.2 Create Primary Business Entities

**Step 3: Create SCM Material Request Entity**
- Set primary field to "Request Number"
- Configure auto-numbering format: MRF-{YYYY}-{####}
- Set ownership to "User or Team"
- Enable audit trail
- Configure quick create form

**Step 4: Create SCM Request Item Entity**
- Set as child entity of Material Request
- Configure cascade delete
- Set up calculated fields for totals

### Phase 2: Logistics Entities

#### 2.1 Driver and Vehicle Management

**Step 5: Create SCM Driver Entity**
- Enable for mobile offline
- Configure GPS location fields
- Set up push notifications for task assignments

**Step 6: Create SCM Vehicle Entity**
- Link to maintenance systems
- Configure service alerts
- Set up utilization tracking

#### 2.2 Task Management

**Step 7: Create SCM Logistics Task Entity**
- Set up SLA calculations
- Configure automatic assignment rules
- Enable GPS tracking integration
- Set up status progression validation

**Step 8: Create SCM Proof of Delivery Entity**
- Enable camera integration
- Configure signature capture
- Set up GPS verification
- Enable offline sync

### Phase 3: Audit and History

#### 3.1 Status Tracking

**Step 9: Create SCM Status History Entity**
- Set up automatic record creation
- Configure change tracking
- Enable comprehensive logging
- Set up retention policies

## Business Rules Implementation

### Rule 1: Material Request Status Validation

```javascript
// Business Rule: Status Progression Validation
if (scm_status.oldValue != null && scm_status.newValue != null) {
    var validTransitions = {
        "Submitted": ["Picking", "On Hold", "Cancelled"],
        "Picking": ["Partial Pick - Open", "Staged", "On Hold"],
        "Partial Pick - Open": ["Partial Pick - Closed", "Picking"],
        "Partial Pick - Closed": ["Staged"],
        "Staged": ["In Transit", "On Hold"],
        "In Transit": ["Delivered", "On Hold"],
        "On Hold": ["Submitted", "Picking", "Staged", "In Transit"],
        "Delivered": [],
        "Cancelled": []
    };
    
    var allowedTransitions = validTransitions[scm_status.oldValue] || [];
    
    if (!allowedTransitions.includes(scm_status.newValue)) {
        scm_status.addError("Invalid status transition from " + 
                           scm_status.oldValue + " to " + scm_status.newValue);
    }
}
```

### Rule 2: Priority Auto-Assignment

```javascript
// Business Rule: Auto-assign MC Priority Flag for P1 requests
if (scm_priority == "P1" && scm_mcpriorityflag != true) {
    scm_mcpriorityflag = true;
    scm_acpriority = 10;
}
```

### Rule 3: SLA Calculation

```javascript
// Business Rule: Calculate SLA Target based on priority
var currentDate = new Date();
var slaHours = 0;

switch (scm_priority) {
    case "P1":
        slaHours = 4; // 4 hours for critical
        break;
    case "P2":
        slaHours = 24; // 1 day for high
        break;
    case "P3":
        slaHours = 72; // 3 days for normal
        break;
    case "P4":
        slaHours = 168; // 1 week for low
        break;
}

scm_estimateddelivery = new Date(currentDate.getTime() + (slaHours * 60 * 60 * 1000));
```

## Security Role Configuration

### Create Custom Security Roles

#### SCM Requestor Role
- Can create and view own requests
- Read access to delivery locations
- Limited write permissions

#### SCM Material Coordinator Role
- Full access to material requests
- Manage request items
- Configure priority settings

#### SCM Driver Role
- View assigned tasks only
- Update task status
- Create POD records
- Limited to own records

## Form Configuration

### Material Request Form Layout

```
┌─────────────────────────────────────────────────────────┐
│ Material Request Information                            │
├─────────────────────────────────────────────────────────┤
│ Request Number: [Auto-generated]                        │
│ Status: [Choice Field]                                  │
│ Priority: [Choice Field]                                │
│ Created Date: [Auto-populated]                          │
│ Required By: [Date/Time Picker]                         │
├─────────────────────────────────────────────────────────┤
│ Requestor Information                                   │
├─────────────────────────────────────────────────────────┤
│ Requested By: [User Lookup]                             │
│ Requestor Name: [Text Field]                            │
│ Department: [Text Field]                                │
├─────────────────────────────────────────────────────────┤
│ Delivery Information                                    │
├─────────────────────────────────────────────────────────┤
│ Delivery Location: [Lookup to Delivery Location]        │
│ MC Priority Flag: [Yes/No]                              │
│ AC Priority: [Number 1-10]                              │
├─────────────────────────────────────────────────────────┤
│ Related Items (Subgrid)                                 │
│ [Request Items with Add/Edit/Delete]                    │
└─────────────────────────────────────────────────────────┘
```

### Mobile Form for Drivers

```
┌─────────────────────────────────────────────────────────┐
│ Task Information                                        │
├─────────────────────────────────────────────────────────┤
│ Task Number: [Display Only]                             │
│ Type: [Display Only]                                    │
│ Priority: [Display Only]                                │
│ Description: [Display Only]                             │
├─────────────────────────────────────────────────────────┤
│ Locations                                               │
├─────────────────────────────────────────────────────────┤
│ Pickup: [Display Only]                                  │
│ Dropoff: [Display Only]                                 │
├─────────────────────────────────────────────────────────┤
│ Actions                                                 │
├─────────────────────────────────────────────────────────┤
│ [Start Task] [Arrive at Pickup] [Complete Pickup]       │
│ [Arrive at Dropoff] [Complete Delivery]                 │
├─────────────────────────────────────────────────────────┤
│ Proof of Delivery                                       │
├─────────────────────────────────────────────────────────┤
│ [Capture Signature] [Take Photos] [Add Notes]           │
└─────────────────────────────────────────────────────────┘
```

## Data Migration Scripts

### Sample Data Import Script

```javascript
// Power Automate Flow: Migrate Material Requests
var sourceData = [
    {
        "id": "MRF-2024-0001",
        "status": "Submitted",
        "priority": "P2",
        "items": 3,
        "workOrders": "WO-12345, WO-12346",
        "createdDate": "2024-01-15T09:30:00Z",
        "requiredBy": "2024-01-16T17:00:00Z",
        "requestedBy": "john.doe@company.com",
        "deliveryLocation": "Admin Building, Ground Floor, Room 101",
        "requestorName": "John Doe"
    }
    // ... more records
];

// Create records in Dataverse
for (var i = 0; i < sourceData.length; i++) {
    var record = sourceData[i];
    
    // Map to Dataverse fields
    var materialRequest = {
        "scm_requestnumber": record.id,
        "scm_status": record.status,
        "scm_priority": record.priority,
        "scm_items": record.items,
        "scm_workorders": record.workOrders,
        "scm_createddate": record.createdDate,
        "scm_requiredby": record.requiredBy,
        "scm_deliverylocation": lookupDeliveryLocation(record.deliveryLocation),
        "scm_requestorname": record.requestorName
    };
    
    // Create record using Dataverse connector
    createRecord("scm_materialrequests", materialRequest);
}
```

## Testing and Validation

### Test Cases

1. **Entity Creation**
   - Verify all entities can be created
   - Test field validation rules
   - Confirm business rules work correctly

2. **Relationship Testing**
   - Test cascade deletes
   - Verify lookup field functionality
   - Test calculated fields

3. **Security Testing**
   - Verify role-based access
   - Test field-level security
   - Confirm data isolation

4. **Performance Testing**
   - Test with large datasets
   - Verify query performance
   - Test mobile sync capabilities

### Validation Checklist

- [ ] All entities created successfully
- [ ] Relationships configured correctly
- [ ] Business rules implemented and tested
- [ ] Security roles assigned appropriately
- [ ] Forms configured for all user types
- [ ] Mobile optimization completed
- [ ] Data migration completed successfully
- [ ] Performance testing passed
- [ ] User acceptance testing completed

## Next Steps

After implementing these entities:

1. **Create PowerApps Applications** (Next phase)
2. **Set up Power Automate Flows**
3. **Configure Power BI Dashboards**
4. **Implement Teams Integration**
5. **Set up Monitoring and Alerts**

This implementation provides a solid foundation for your SCM Hub migration to the Power Platform ecosystem.
