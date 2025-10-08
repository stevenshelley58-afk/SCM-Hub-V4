# SCM Hub - Data Flow & Integration Architecture

**Generated:** 2025-10-08  
**Purpose:** Define master data sync, SharePoint integration, async handling  
**Version:** 1.0

---

## 🎯 OVERVIEW

The SCM Hub data flows from multiple sources:
1. **SharePoint/Dataverse** - Master data (WO materials from JDE)
2. **App Database** - Operational data (requests, picks, deliveries)
3. **Toll (LTR) System** - Delivery tasks
4. **JDE (Future)** - Material issue confirmations

**Key Challenge:** 
> "Materials off-site controlled by SharePoint, materials on-site controlled by app. Must handle async data and resolve conflicts."

---

## 📊 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│     JDE      │───▶│ SharePoint/  │───▶│  Staging     │
│  (Source of  │    │  Dataverse   │    │   Table      │
│   Truth)     │    │  (Export)    │    │  (Hourly)    │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                                 │
                    ┌────────────────────────────┤
                    │        SYNC ENGINE         │
                    │  (Conflict Resolution)     │
                    └────────────────────────────┤
                                                 │
                                                 ▼
                    ┌────────────────────────────────────┐
                    │      SCM HUB DATABASE              │
                    │  (Operational Data)                │
                    ├────────────────────────────────────┤
                    │ • Work Order Materials             │
                    │ • Material Requests                │
                    │ • Pick Status                      │
                    │ • Delivery Status                  │
                    │ • Locks & Reservations             │
                    │ • Audit Trail                      │
                    └────────────┬───────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
      ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
      │   Toll LTR  │  │ Notification│  │   Reports   │
      │   System    │  │   Service   │  │  & Analytics│
      └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 🔄 MASTER DATA SYNC FLOW

### 1. SharePoint Export Process

**Frequency:** Every 1 hour (configurable)

**Flow:**
```
┌────────────────────────────────────────────────────────────┐
│ STEP 1: SharePoint Export (External Process)              │
└────────────────────────────────────────────────────────────┘

JDE System:
• Work Orders updated in real-time
• Material allocations changed
• Quantities adjusted
• Status updates

     ↓ (Periodic Export - every 1 hour)

SharePoint/Dataverse:
• Receives JDE export
• Stores in list/table
• Makes available via API/Export


┌────────────────────────────────────────────────────────────┐
│ STEP 2: SCM Hub Fetch (Our Process)                       │
└────────────────────────────────────────────────────────────┘

Every hour at :00:
1. Check last sync timestamp
2. Fetch new/changed records from SharePoint
3. Store in Staging Table
4. Trigger sync process


┌────────────────────────────────────────────────────────────┐
│ STEP 3: Conflict Detection                                │
└────────────────────────────────────────────────────────────┘

For each SharePoint record:
1. Check if exists in App Database
2. Compare values
3. Detect conflicts:
   
   CONFLICT TYPES:
   
   a) Material Requested in App (Not in SharePoint)
      Example: App shows material requested, 
               SharePoint doesn't know about it yet
      Resolution: Keep app data (on-site activity wins)
   
   b) Material Issued in JDE (SharePoint updated)
      Example: Qube issued material in JDE,
               SharePoint shows new quantity
      Resolution: Use SharePoint data (off-site system wins)
   
   c) Material Removed from WO (SharePoint deleted)
      Example: Engineering removed material from WO,
               App still shows it
      Resolution: Use SharePoint (mark as removed in app)
   
   d) Quantity Changed (Both sides modified)
      Example: SharePoint shows 100, App shows 95
      Resolution: Check "on-site" flag:
               - If on-site: Use app (could be issued)
               - If not on-site: Use SharePoint


┌────────────────────────────────────────────────────────────┐
│ STEP 4: Auto-Resolution                                   │
└────────────────────────────────────────────────────────────┘

Apply Resolution Rules:
┌────────────────────────────────────────┐
│ IF material has active request:       │
│    → Keep app data                     │
│    → Flag for MC review                │
│                                        │
│ IF material status = "Delivered":      │
│    → Keep app data                     │
│    → Ignore SharePoint changes         │
│                                        │
│ IF material status = "In Transit":     │
│    → Keep app data                     │
│    → Ignore SharePoint changes         │
│                                        │
│ IF material not requested:             │
│    → Use SharePoint data               │
│    → Update app                        │
│                                        │
│ IF can't auto-resolve:                 │
│    → Flag for MC manual resolution     │
│    → Send notification                 │
└────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────┐
│ STEP 5: Apply Updates                                     │
└────────────────────────────────────────────────────────────┘

For auto-resolved conflicts:
1. Update App Database
2. Log change in audit trail
3. Update "lastSyncedAt" timestamp
4. Clear from staging table

For manual conflicts:
1. Create conflict record
2. Notify MC
3. Show in Conflict Dashboard
4. Wait for MC resolution


┌────────────────────────────────────────────────────────────┐
│ STEP 6: Cleanup                                            │
└────────────────────────────────────────────────────────────┘

1. Remove processed records from staging
2. Update sync status
3. Log sync stats:
   • Records fetched
   • Records updated
   • Records added
   • Conflicts auto-resolved
   • Conflicts requiring manual review
```

---

## 🗄️ DATA STRUCTURES

### Staging Table

```typescript
interface StagingRecord {
  id: string;
  syncBatchId: string;           // Groups records from same sync
  fetchedAt: string;
  processedAt?: string;
  
  // SharePoint data
  sharePointData: {
    WorkOrderNumber: string;
    LineNumber: number;
    OpsSequence: number;
    Team: string;
    PackNumber: string | null;
    MaterialDescription: string;
    Quantity: number;
    UOM: string;
    // ... all WO material fields
  };
  
  // App data (if exists)
  appData?: {
    // Same structure as sharePointData
  };
  
  // Conflict info
  hasConflict: boolean;
  conflictType?: 'quantity_mismatch' | 'material_removed' | 'status_conflict' | 'other';
  conflictDetails?: string;
  
  // Resolution
  status: 'pending' | 'resolved' | 'needs_manual_review';
  resolution?: 'use_sharepoint' | 'use_app' | 'merge' | 'manual';
  resolvedAt?: string;
  resolvedBy?: string;
}
```

### Sync Log

```typescript
interface SyncLog {
  id: string;
  batchId: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  
  // Stats
  stats: {
    recordsFetched: number;
    recordsAdded: number;
    recordsUpdated: number;
    recordsRemoved: number;
    recordsUnchanged: number;
    
    conflictsDetected: number;
    conflictsAutoResolved: number;
    conflictsManualReview: number;
  };
  
  // Errors
  errors: {
    timestamp: string;
    error: string;
    record?: string;
  }[];
  
  // Performance
  performance: {
    fetchDuration: number;      // ms
    processDuration: number;    // ms
    totalDuration: number;      // ms
  };
}
```

### Conflict Record

```typescript
interface DataConflict {
  id: string;
  createdAt: string;
  syncBatchId: string;
  
  // Entity info
  entityType: 'wo_material';
  entityKey: string;             // e.g., "WO-12345-10"
  
  // Data comparison
  sharePointValue: any;
  appValue: any;
  field: string;                 // Which field has conflict
  
  // Conflict details
  conflictType: 'quantity_mismatch' | 'material_removed' | 'status_conflict' | 'other';
  conflictReason: string;        // Human-readable explanation
  
  // On-site status
  materialOnSite: boolean;       // Determines auto-resolution
  hasActiveRequest: boolean;
  requestStatus?: string;
  
  // Resolution
  status: 'pending' | 'resolved' | 'ignored';
  resolution?: 'use_sharepoint' | 'use_app' | 'merge' | 'manual';
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  
  // Priority
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresImmediate Attention: boolean;
}
```

---

## ⚙️ SYNC ENGINE IMPLEMENTATION

### Sync Service

```typescript
class MasterDataSyncService {
  private config: SyncConfig;
  private isRunning: boolean = false;
  
  // Main sync function (called every hour)
  async sync(): Promise<SyncLog> {
    if (this.isRunning) {
      console.warn('Sync already running, skipping');
      return;
    }
    
    this.isRunning = true;
    const batchId = generateId();
    const startTime = Date.now();
    
    const log: SyncLog = {
      id: generateId(),
      batchId,
      startedAt: new Date().toISOString(),
      status: 'running',
      stats: {
        recordsFetched: 0,
        recordsAdded: 0,
        recordsUpdated: 0,
        recordsRemoved: 0,
        recordsUnchanged: 0,
        conflictsDetected: 0,
        conflictsAutoResolved: 0,
        conflictsManualReview: 0,
      },
      errors: [],
      performance: {
        fetchDuration: 0,
        processDuration: 0,
        totalDuration: 0,
      },
    };
    
    try {
      // Step 1: Fetch from SharePoint
      const fetchStart = Date.now();
      const sharePointRecords = await this.fetchFromSharePoint();
      log.stats.recordsFetched = sharePointRecords.length;
      log.performance.fetchDuration = Date.now() - fetchStart;
      
      // Step 2: Store in staging
      await this.storeInStaging(sharePointRecords, batchId);
      
      // Step 3: Process records
      const processStart = Date.now();
      const result = await this.processRecords(batchId);
      log.stats = { ...log.stats, ...result.stats };
      log.errors = result.errors;
      log.performance.processDuration = Date.now() - processStart;
      
      // Step 4: Cleanup
      await this.cleanup(batchId);
      
      log.status = log.errors.length > 0 ? 'partial' : 'completed';
      log.completedAt = new Date().toISOString();
      log.performance.totalDuration = Date.now() - startTime;
      
    } catch (error) {
      log.status = 'failed';
      log.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
      });
      log.completedAt = new Date().toISOString();
      log.performance.totalDuration = Date.now() - startTime;
    } finally {
      this.isRunning = false;
      await this.saveSyncLog(log);
      
      // Notify MC if errors or manual conflicts
      if (log.errors.length > 0 || log.stats.conflictsManualReview > 0) {
        await this.notifyMC(log);
      }
    }
    
    return log;
  }
  
  // Fetch from SharePoint
  async fetchFromSharePoint(): Promise<SharePointRecord[]> {
    const lastSync = await this.getLastSyncTimestamp();
    
    // Call SharePoint API/Export
    const response = await fetch(this.config.sharePointUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.sharePointToken}`,
        'Accept': 'application/json',
      },
      params: {
        $filter: `Modified gt ${lastSync}`,  // Only changed records
        $orderby: 'Modified asc',
      },
    });
    
    if (!response.ok) {
      throw new Error(`SharePoint fetch failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.value || data.d?.results || data;
  }
  
  // Store in staging table
  async storeInStaging(
    sharePointRecords: SharePointRecord[],
    batchId: string
  ): Promise<void> {
    for (const spRecord of sharePointRecords) {
      const key = this.getRecordKey(spRecord);
      const appRecord = await this.getAppRecord(key);
      
      const stagingRecord: StagingRecord = {
        id: generateId(),
        syncBatchId: batchId,
        fetchedAt: new Date().toISOString(),
        sharePointData: spRecord,
        appData: appRecord,
        hasConflict: false,
        status: 'pending',
      };
      
      await db.staging.insert(stagingRecord);
    }
  }
  
  // Process all staged records
  async processRecords(batchId: string): Promise<ProcessResult> {
    const records = await db.staging.find({ syncBatchId: batchId });
    
    const result: ProcessResult = {
      stats: {
        recordsAdded: 0,
        recordsUpdated: 0,
        recordsRemoved: 0,
        recordsUnchanged: 0,
        conflictsDetected: 0,
        conflictsAutoResolved: 0,
        conflictsManualReview: 0,
      },
      errors: [],
    };
    
    for (const record of records) {
      try {
        if (!record.appData) {
          // New record - add to app
          await this.addRecord(record.sharePointData);
          result.stats.recordsAdded++;
          record.status = 'resolved';
          record.resolution = 'use_sharepoint';
        } else {
          // Existing record - check for conflicts
          const conflicts = this.detectConflicts(
            record.sharePointData,
            record.appData
          );
          
          if (conflicts.length === 0) {
            // No changes
            result.stats.recordsUnchanged++;
            record.status = 'resolved';
          } else {
            // Has conflicts
            result.stats.conflictsDetected += conflicts.length;
            
            const canAutoResolve = this.canAutoResolve(record, conflicts);
            
            if (canAutoResolve) {
              // Auto-resolve
              const resolution = this.autoResolve(record, conflicts);
              await this.applyResolution(record, resolution);
              result.stats.conflictsAutoResolved++;
              result.stats.recordsUpdated++;
              record.status = 'resolved';
              record.resolution = resolution.action;
            } else {
              // Needs manual review
              await this.createConflictRecord(record, conflicts);
              result.stats.conflictsManualReview++;
              record.status = 'needs_manual_review';
            }
          }
        }
        
        record.processedAt = new Date().toISOString();
        await db.staging.update(record);
        
      } catch (error) {
        result.errors.push({
          timestamp: new Date().toISOString(),
          error: error.message,
          record: record.id,
        });
      }
    }
    
    return result;
  }
  
  // Detect conflicts between SharePoint and App data
  detectConflicts(
    spData: SharePointRecord,
    appData: WOMaterial
  ): Conflict[] {
    const conflicts: Conflict[] = [];
    
    // Check each field
    const fieldsToCheck = [
      'MaterialDescription',
      'Quantity',
      'UOM',
      'Team',
      'PackNumber',
      // ... other fields
    ];
    
    for (const field of fieldsToCheck) {
      if (spData[field] !== appData[field]) {
        conflicts.push({
          field,
          sharePointValue: spData[field],
          appValue: appData[field],
          type: this.getConflictType(field, spData, appData),
        });
      }
    }
    
    return conflicts;
  }
  
  // Determine if conflicts can be auto-resolved
  canAutoResolve(
    record: StagingRecord,
    conflicts: Conflict[]
  ): boolean {
    const appData = record.appData;
    
    // Check if material is "on-site" (has active request/delivery)
    if (appData.requestStatus === 'Delivered') {
      // Material delivered - app data is source of truth
      return true;
    }
    
    if (appData.requestStatus === 'In Transit') {
      // Material in transit - app data is source of truth
      return true;
    }
    
    if (appData.requestStatus === 'Staged') {
      // Material staged - app data is source of truth
      return true;
    }
    
    if (appData.hasActiveRequest) {
      // Has active request - needs review
      return false; // Flag for MC
    }
    
    // No active on-site activity - can auto-resolve to SharePoint
    return true;
  }
  
  // Auto-resolve conflict
  autoResolve(
    record: StagingRecord,
    conflicts: Conflict[]
  ): Resolution {
    const appData = record.appData;
    
    // Determine which data to use
    if (appData.requestStatus === 'Delivered' ||
        appData.requestStatus === 'In Transit' ||
        appData.requestStatus === 'Staged') {
      // Use app data (on-site activity wins)
      return {
        action: 'use_app',
        reason: 'Material on-site, app data is source of truth',
        conflicts,
      };
    } else {
      // Use SharePoint data (off-site system wins)
      return {
        action: 'use_sharepoint',
        reason: 'No active on-site activity, SharePoint data is source of truth',
        conflicts,
      };
    }
  }
  
  // Apply resolution
  async applyResolution(
    record: StagingRecord,
    resolution: Resolution
  ): Promise<void> {
    if (resolution.action === 'use_sharepoint') {
      // Update app with SharePoint data
      await db.woMaterials.update(
        { key: this.getRecordKey(record.sharePointData) },
        record.sharePointData
      );
    }
    // If 'use_app', do nothing (app already has correct data)
    
    // Log in audit trail
    await db.auditLog.insert({
      timestamp: new Date().toISOString(),
      action: 'data_sync_resolved',
      details: {
        record: record.id,
        resolution: resolution.action,
        reason: resolution.reason,
      },
    });
  }
  
  // Create conflict record for MC review
  async createConflictRecord(
    record: StagingRecord,
    conflicts: Conflict[]
  ): Promise<void> {
    for (const conflict of conflicts) {
      const conflictRecord: DataConflict = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        syncBatchId: record.syncBatchId,
        entityType: 'wo_material',
        entityKey: this.getRecordKey(record.sharePointData),
        sharePointValue: conflict.sharePointValue,
        appValue: conflict.appValue,
        field: conflict.field,
        conflictType: conflict.type,
        conflictReason: this.explainConflict(conflict, record),
        materialOnSite: this.isMaterialOnSite(record.appData),
        hasActiveRequest: record.appData?.hasActiveRequest || false,
        requestStatus: record.appData?.requestStatus,
        status: 'pending',
        priority: this.getConflictPriority(conflict, record),
        requiresImmediateAttention: this.requiresImmediateAttention(conflict, record),
      };
      
      await db.conflicts.insert(conflictRecord);
    }
  }
  
  // Cleanup processed records
  async cleanup(batchId: string): Promise<void> {
    // Remove resolved records from staging
    await db.staging.deleteMany({
      syncBatchId: batchId,
      status: 'resolved',
    });
  }
  
  // Helper functions
  private getRecordKey(record: SharePointRecord): string {
    return `${record.WorkOrderNumber}-${record.LineNumber}`;
  }
  
  private async getAppRecord(key: string): Promise<WOMaterial | null> {
    return await db.woMaterials.findOne({ key });
  }
  
  private isMaterialOnSite(appData: WOMaterial): boolean {
    const onSiteStatuses = ['Delivered', 'In Transit', 'Staged', 'Picking'];
    return onSiteStatuses.includes(appData?.requestStatus);
  }
  
  private getConflictPriority(
    conflict: Conflict,
    record: StagingRecord
  ): string {
    if (record.appData?.hasActiveRequest && record.appData?.priority === 'P1') {
      return 'critical';
    }
    if (conflict.field === 'Quantity' && record.appData?.hasActiveRequest) {
      return 'high';
    }
    return 'medium';
  }
  
  private requiresImmediateAttention(
    conflict: Conflict,
    record: StagingRecord
  ): boolean {
    return (
      record.appData?.hasActiveRequest &&
      record.appData?.priority === 'P1' &&
      conflict.field === 'Quantity'
    );
  }
  
  private explainConflict(conflict: Conflict, record: StagingRecord): string {
    const spVal = conflict.sharePointValue;
    const appVal = conflict.appValue;
    const field = conflict.field;
    
    if (field === 'Quantity') {
      return `Quantity mismatch: SharePoint shows ${spVal}, App shows ${appVal}. ` +
             `This could indicate ${Math.abs(spVal - appVal)} units were issued in JDE.`;
    }
    
    if (field === 'MaterialDescription') {
      return `Material description changed in SharePoint from "${appVal}" to "${spVal}". ` +
             `This may affect existing requests.`;
    }
    
    return `${field} changed from "${appVal}" to "${spVal}" in SharePoint.`;
  }
}
```

---

## 🖥️ MC CONFLICT RESOLUTION UI

### Data Sync Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│ Master Data Sync Dashboard                                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Last Sync: 10/8/2025 2:00 PM ✓                              │
│ Next Sync: 10/8/2025 3:00 PM (in 45 minutes)                │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Today's Stats                                            ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ Records Fetched:    1,234                                ││
│ │ Records Added:      12                                   ││
│ │ Records Updated:    127                                  ││
│ │ Records Unchanged:  1,095                                ││
│ │                                                          ││
│ │ Conflicts Detected: 8                                    ││
│ │ Auto-Resolved:      6                                    ││
│ │ Manual Review:      2 ⚠️                                 ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ⚠️ Requires Attention:                                      │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 🔴 WO-12345 Line 10: Quantity mismatch (P1 request) [📋]││
│ │    SP: 100 | App: 95 | Request: MRF-1234                ││
│ │                                                          ││
│ │ 🟡 WO-12346 Line 5: Material description changed    [📋]││
│ │    SP: "Pipe 2in x 10ft" | App: "Pipe 2in x 12ft"       ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ [Sync Now] [View All Conflicts] [Sync History] [Settings]   │
└──────────────────────────────────────────────────────────────┘
```

### Conflict Resolution

```
┌──────────────────────────────────────────────────────────────┐
│ Resolve Conflict: WO-12345 Line 10              [✕ Close]   │
├──────────────────────────────────────────────────────────────┤
│ Conflict Type: Quantity Mismatch                            │
│ Priority: 🔴 Critical (P1 request active)                    │
│ Detected: 10/8/2025 2:00 PM (45 minutes ago)                │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Material Details                                       │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ WO: 12345 | Line: 10 | Ops: 20                        │ │
│ │ Material: Pipe 2" x 10ft                               │ │
│ │ Team: A                                                │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Conflict: Quantity                                     │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ SharePoint Value: 100                                  │ │
│ │ (From JDE, updated 10/8 1:30 PM)                       │ │
│ │                                                        │ │
│ │ App Value: 95                                          │ │
│ │ (Last updated 10/7 3:00 PM)                            │ │
│ │                                                        │ │
│ │ Difference: -5 (App shows 5 fewer)                     │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Active Request                                         │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ MRF-1234 (P1 - Critical)                               │ │
│ │ Status: Picking (started 1 hour ago)                   │ │
│ │ Requested: 10 units                                    │ │
│ │ Requestor: Jane Doe                                    │ │
│ │ [View Request]                                         │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Possible Reasons:                                            │
│ • 5 units were issued in JDE (not reflected in app yet)     │
│ • Data entry error in SharePoint                            │
│ • Material consumed by another work order                   │
│                                                              │
│ Recommended Action:                                          │
│ Use SharePoint data (100) - Likely correct from JDE         │
│                                                              │
│ Resolution Options:                                          │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ (•) Use SharePoint (100)                               │ │
│ │     Update app to match JDE/SharePoint                 │ │
│ │                                                        │ │
│ │ ( ) Use App (95)                                       │ │
│ │     Keep app data, ignore SharePoint                   │ │
│ │                                                        │ │
│ │ ( ) Manual Value: [___]                                │ │
│ │     Enter correct value manually                       │ │
│ │                                                        │ │
│ │ ( ) Ignore This Time                                   │ │
│ │     Keep both values, resolve later                    │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Notes: (required)                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Checked with warehouse - 5 units were issued__________ │ │
│ │ yesterday for emergency repair. Using SP value._______ │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ☑ Notify requestor (Jane Doe) of quantity change            │
│ ☑ Notify picker (JJ) if still picking                       │
│                                                              │
│ [Cancel] [Ignore] [Resolve]                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔗 TOLL (LTR) INTEGRATION

### Data Flow to Toll System

**When:** Material request status changes

**Flow:**
```
SCM Hub Event                  →  LTR API Call
────────────────────────────────────────────────

1. Request Created (Submitted)
   → POST /api/tasks
   {
     mrfId: "MRF-1234",
     status: "pending",
     deliveryLocation: "Unit 12",
     requestor: "Jane Doe",
     priority: "P1",
     requiredBy: "2025-10-08 5:00 PM",
     itemSummary: "4 items, ~150 lbs",
     specialInstructions: null,
   }

2. Picking Started
   → PATCH /api/tasks/MRF-1234
   {
     status: "pending",
     pickerName: "JJ",
     estimatedReady: "2025-10-08 3:00 PM",
     itemDetails: [ { item: "Pipe 2in", qty: 10 }, ... ]
   }

3. Staged (Ready for Collection)
   → PATCH /api/tasks/MRF-1234
   {
     status: "ready",
     stagedAt: "2025-10-08 2:45 PM",
     pickupLocation: "Qube Warehouse Bay 3",
     itemCount: 4,
     photos: ["photo1.jpg", "photo2.jpg"],
   }

4. Toll Accepts
   ← WEBHOOK from LTR
   {
     mrfId: "MRF-1234",
     status: "accepted",
     driverName: "John Driver",
     driverPhone: "+1-555-0100",
     estimatedPickup: "2025-10-08 3:15 PM",
     estimatedDelivery: "2025-10-08 4:00 PM",
   }
   
   → Update SCM Hub:
     - Status: "In Transit"
     - Driver info displayed
     - ETA displayed

5. Toll Delivers
   ← WEBHOOK from LTR
   {
     mrfId: "MRF-1234",
     status: "delivered",
     deliveredAt: "2025-10-08 4:10 PM",
     deliveredTo: "Jane Doe",
     podPhoto: "delivery_photo.jpg",
     podSignature: "signature_data",
   }
   
   → Update SCM Hub:
     - Status: "Delivered"
     - POD captured
     - Notify requestor
```

### LTR Integration Service

```typescript
class TollIntegrationService {
  private config: TollConfig;
  
  // Push request to LTR
  async createTollTask(request: MaterialRequest): Promise<void> {
    const task = {
      mrfId: request.id,
      status: 'pending',
      deliveryLocation: request.deliveryLocation,
      requestor: request.RequestedBy,
      priority: request.priority,
      requiredBy: request.RequiredByTimestamp,
      itemSummary: this.getItemSummary(request),
      specialInstructions: request.specialInstructions,
      
      // Pickup info
      pickupLocation: 'Qube Warehouse',
      pickupContact: 'Warehouse Manager',
      pickupPhone: '+1-555-0199',
    };
    
    try {
      await fetch(`${this.config.ltrApiUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.ltrApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });
      
      // Log success
      await db.auditLog.insert({
        timestamp: new Date().toISOString(),
        action: 'ltr_task_created',
        details: { mrfId: request.id },
      });
      
    } catch (error) {
      // Log error, but don't fail request
      console.error('Failed to push to LTR:', error);
      await db.errorLog.insert({
        timestamp: new Date().toISOString(),
        severity: 'error',
        message: `Failed to push MRF-${request.id} to LTR: ${error.message}`,
      });
    }
  }
  
  // Update LTR task
  async updateTollTask(
    mrfId: string,
    updates: Partial<TollTask>
  ): Promise<void> {
    try {
      await fetch(`${this.config.ltrApiUrl}/tasks/${mrfId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.ltrApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update LTR:', error);
    }
  }
  
  // Handle webhook from LTR
  async handleWebhook(payload: TollWebhook): Promise<void> {
    const { mrfId, status, ...data } = payload;
    
    // Find request
    const request = await db.requests.findOne({ id: mrfId });
    if (!request) {
      throw new Error(`Request ${mrfId} not found`);
    }
    
    // Update based on status
    if (status === 'accepted') {
      // Toll accepted the job
      await db.requests.update(
        { id: mrfId },
        {
          status: 'In Transit',
          tollDriver: data.driverName,
          tollDriverPhone: data.driverPhone,
          estimatedDeliveryTime: data.estimatedDelivery,
        }
      );
      
      // Notify requestor
      await notificationService.send({
        recipients: [request.RequestedBy],
        event: 'request_in_transit',
        data: {
          mrfId,
          driverName: data.driverName,
          eta: data.estimatedDelivery,
        },
      });
    }
    
    if (status === 'delivered') {
      // Toll delivered the materials
      await db.requests.update(
        { id: mrfId },
        {
          status: 'Delivered',
          deliveredAt: data.deliveredAt,
          deliveredTo: data.deliveredTo,
          podPhoto: data.podPhoto,
          podSignature: data.podSignature,
        }
      );
      
      // Notify requestor
      await notificationService.send({
        recipients: [request.RequestedBy],
        event: 'request_delivered',
        data: {
          mrfId,
          deliveredAt: data.deliveredAt,
        },
      });
    }
    
    // Log webhook
    await db.auditLog.insert({
      timestamp: new Date().toISOString(),
      action: 'ltr_webhook_received',
      details: { mrfId, status, data },
    });
  }
  
  private getItemSummary(request: MaterialRequest): string {
    const itemCount = request.items.length;
    const totalWeight = request.items.reduce((sum, item) => 
      sum + (item.weight || 0), 0
    );
    return `${itemCount} items, ~${Math.round(totalWeight)} lbs`;
  }
}
```

---

## ⚙️ MC INTEGRATION SETTINGS

### SharePoint Integration

```
┌──────────────────────────────────────────────────────────────┐
│ SharePoint / Dataverse Integration                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ☑ Enable automatic sync                                     │
│                                                              │
│ SharePoint URL:                                              │
│ [https://sharepoint.example.com/sites/SCM/_______________]   │
│ [___________________________________/MaterialList__________] │
│                                                              │
│ Authentication:                                              │
│ (•) OAuth 2.0  ( ) API Key  ( ) Username/Password           │
│                                                              │
│ Client ID:                                                   │
│ [abc123xyz456________________________________]               │
│                                                              │
│ Client Secret:                                               │
│ [••••••••••••••••••••••••••••]                              │
│                                                              │
│ Tenant ID:                                                   │
│ [contoso.onmicrosoft.com_______________________________]     │
│                                                              │
│ Sync Frequency:                                              │
│ [1] hour(s)  [Start Time: 00:00]                             │
│                                                              │
│ Conflict Resolution:                                         │
│ ☑ Auto-resolve when material not on-site                    │
│ ☑ Auto-resolve when no active requests                      │
│ ☑ Flag for manual review when P1 request active             │
│ ☑ Notify MC of all conflicts                                │
│                                                              │
│ Error Handling:                                              │
│ ☐ Pause sync on errors                                      │
│ ☑ Retry failed syncs: [3] times                             │
│ ☑ Email MC on sync failures                                 │
│                                                              │
│ [Test Connection] [Sync Now] [Save Settings]                 │
└──────────────────────────────────────────────────────────────┘
```

### Toll (LTR) Integration

```
┌──────────────────────────────────────────────────────────────┐
│ Toll Task Request (LTR) Integration                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ☑ Enable Toll integration                                   │
│                                                              │
│ LTR API URL:                                                 │
│ [https://ltr.example.com/api/v1_________________________]    │
│                                                              │
│ API Key:                                                     │
│ [••••••••••••••••••••••••••••]                              │
│                                                              │
│ Webhook URL (for LTR callbacks):                             │
│ [https://scmhub.example.com/api/webhooks/toll__________]     │
│ [Copy to Clipboard]                                          │
│                                                              │
│ Auto-Push to LTR:                                            │
│ ☑ Push when request submitted                               │
│ ☑ Update when picking starts                                │
│ ☑ Update when staged                                        │
│ ☐ Push to "Pending" queue before staged                     │
│                                                              │
│ Qube Early Scheduling:                                       │
│ ☑ Allow Qube to schedule pickup before staging complete     │
│ ☐ Require MC approval for early scheduling                  │
│                                                              │
│ Data to Send:                                                │
│ ☑ Delivery location                                         │
│ ☑ Requestor name                                            │
│ ☑ Priority level                                            │
│ ☑ Required by date                                          │
│ ☑ Item summary                                              │
│ ☑ Special instructions                                      │
│ ☑ Photos of staged materials                                │
│                                                              │
│ [Test Connection] [Test Webhook] [Save Settings]             │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 SUMMARY

### Data Flows:
1. **SharePoint → App** (Hourly sync)
2. **App → Toll LTR** (Real-time push)
3. **Toll LTR → App** (Webhooks)
4. **App → JDE** (Future: Material issue confirmations)

### Conflict Resolution:
- **Auto-Resolve:** When material not on-site or no active requests
- **Manual Review:** When P1 request active or material in transit
- **MC Dashboard:** Visual conflict resolution UI

### Integration Points:
- **SharePoint API** (OAuth 2.0)
- **Toll LTR API** (REST + Webhooks)
- **Email/SMS** (SMTP/Twilio)
- **Teams** (Webhooks)

### Key Principles:
1. **On-Site Wins:** App data takes precedence for on-site materials
2. **Off-Site Wins:** SharePoint takes precedence for off-site materials
3. **Async Handling:** All integrations handle delays gracefully
4. **Error Recovery:** Retry logic and manual fallbacks
5. **Audit Everything:** Complete log of all data changes

---

**End of Document**  
*For questions or changes, update this document and version number*

