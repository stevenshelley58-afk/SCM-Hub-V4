# SCM Hub Integration Services Documentation

## Overview

This document provides comprehensive API documentation for the SCM Hub integration services implemented by Agent 3. These services enable external integrations, notifications, data synchronization, and offline capabilities.

## Table of Contents

1. [Notification Service](#notification-service)
2. [SharePoint Sync Service](#sharepoint-sync-service)
3. [LTR Integration Service](#ltr-integration-service)
4. [Email/SMS Service](#emailsms-service)
5. [Teams Integration Service](#teams-integration-service)
6. [Photo Documentation Service](#photo-documentation-service)
7. [Export Service](#export-service)
8. [Rate Limiting Service](#rate-limiting-service)
9. [Session Management Service](#session-management-service)
10. [Offline Support Service](#offline-support-service)

---

## Notification Service

### Purpose
Centralized notification system for sending alerts to stakeholders via multiple channels (email, SMS, Teams).

### Key Functions

#### `sendNotification(type, recipient, subject, message, mrfId?)`
Send a notification to a recipient.

**Parameters:**
- `type`: 'email' | 'sms' | 'teams' | 'push'
- `recipient`: String (email address or phone number)
- `subject`: String (optional for SMS)
- `message`: String
- `mrfId`: String (optional)

**Returns:** `Promise<Notification>`

**Example:**
```typescript
import { sendNotification } from './services/notificationService';

await sendNotification(
    'email',
    'user@toll.com',
    'Request MRF-1240 Submitted',
    'Your material request has been submitted successfully.',
    'MRF-1240'
);
```

#### `triggerNotification(event, variables, mrfId?)`
Trigger notifications based on configured rules for an event.

**Parameters:**
- `event`: 'submitted' | 'status_change' | 'delay' | 'delivered' | 'short_pick' | 'p1_created'
- `variables`: Object with template variables
- `mrfId`: String (optional)

**Example:**
```typescript
await triggerNotification('submitted', {
    mrfId: 'MRF-1240',
    requestorName: 'Jane Doe',
    priority: 'P2',
    itemCount: '6',
    requiredBy: '2025-07-14',
    deliveryLocation: 'Ops Center Trailer 1'
});
```

---

## SharePoint Sync Service

### Purpose
Synchronize master data from SharePoint with the local system, detect conflicts, and resolve them.

### Key Functions

#### `performSharePointSync()`
Perform a manual SharePoint data sync.

**Returns:** `Promise<SyncStatus>`

**Example:**
```typescript
import { performSharePointSync } from './services/sharepointSyncService';

const result = await performSharePointSync();
console.log(`Synced ${result.recordsProcessed} records`);
```

#### `getSyncConflicts(resolvedFilter?)`
Get list of sync conflicts.

**Returns:** `SyncConflict[]`

#### `resolveConflict(pKey, field, resolution)`
Resolve a detected conflict.

**Parameters:**
- `pKey`: String
- `field`: String
- `resolution`: 'use_sharepoint' | 'use_system' | 'manual'

---

## LTR Integration Service

### Purpose
Integrate with the Logistics Task Router (LTR) system for delivery task management.

### Key Functions

#### `sendToLTR(mrfId, pickupLocation, deliveryLocation, priority, items)`
Send a delivery task to the LTR system.

**Returns:** `Promise<LTRDeliveryTask>`

**Example:**
```typescript
import { sendToLTR } from './services/ltrIntegrationService';

const task = await sendToLTR(
    'MRF-1240',
    'Warehouse 1',
    'Weld Shop',
    'P2',
    6
);
```

#### `retryDelivery(taskId)`
Retry a failed delivery task.

**Returns:** `Promise<void>`

---

## Email/SMS Service

### Purpose
Send email and SMS notifications with delivery tracking.

### Key Functions

#### `sendEmail(message)`
Send an email message.

**Parameters:**
```typescript
{
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    htmlBody?: string;
    attachments?: Array<{
        filename: string;
        content: string;
        type: string;
    }>;
}
```

**Returns:** `Promise<string>` (message ID)

#### `sendSMS(message)`
Send an SMS message.

**Parameters:**
```typescript
{
    to: string;
    body: string;
}
```

**Returns:** `Promise<string>` (message ID)

**Example:**
```typescript
import { sendEmail, sendSMS } from './services/emailSMSService';

// Send email
const emailId = await sendEmail({
    to: ['user@toll.com'],
    subject: 'Request Update',
    body: 'Your request has been delivered.'
});

// Send SMS
const smsId = await sendSMS({
    to: '+61412345678',
    body: 'MRF-1240 is now In Transit'
});
```

---

## Teams Integration Service

### Purpose
Post notifications and interactive cards to Microsoft Teams channels.

### Key Functions

#### `postToTeams(channelId, message)`
Post a message to a Teams channel.

**Returns:** `Promise<string>` (notification ID)

#### `createP1AlertCard(mrfId, requestor, requiredBy, location)`
Create a P1 alert card.

**Returns:** `TeamsMessage`

**Example:**
```typescript
import { postToTeams, createP1AlertCard } from './services/teamsIntegrationService';

const card = createP1AlertCard(
    'MRF-1232',
    'Jane Doe',
    '2025-07-13 08:00',
    'Unit 12 Work Area'
);

await postToTeams('CHANNEL-002', card);
```

---

## Photo Documentation Service

### Purpose
Upload, store, and manage photos for material condition, storage, and delivery documentation.

### Key Functions

#### `uploadPhoto(file, mrfId, type, uploadedBy, notes?)`
Upload a photo.

**Parameters:**
- `file`: File object
- `mrfId`: String
- `type`: 'condition' | 'storage' | 'delivery' | 'pod'
- `uploadedBy`: String
- `notes`: String (optional)

**Returns:** `Promise<PhotoUploadResult>`

**Example:**
```typescript
import { uploadPhoto } from './services/photoService';

const result = await uploadPhoto(
    fileInput.files[0],
    'MRF-1240',
    'delivery',
    'Tom Chen',
    'Delivered to Weld Shop'
);

console.log(`Photo uploaded: ${result.photo.url}`);
console.log(`Compressed from ${result.originalSize} to ${result.compressedSize} bytes`);
```

---

## Export Service

### Purpose
Export data to CSV, Excel, or JSON formats.

### Key Functions

#### `exportMaterialRequests(requests, format)`
Export material requests.

**Parameters:**
- `requests`: MaterialRequest[]
- `format`: 'csv' | 'excel'

**Example:**
```typescript
import { exportMaterialRequests } from './services/exportService';
import { mockRequestsData } from './services/api';

exportMaterialRequests(mockRequestsData, 'excel');
```

#### `exportToCSV(data, filename)`
Export any data to CSV.

#### `exportToJSON(data, filename)`
Export any data to JSON.

---

## Rate Limiting Service

### Purpose
Prevent API abuse and manage request throttling.

### Key Functions

#### `checkRateLimit(identifier, operation)`
Check if a request is within rate limits.

**Returns:** `{ allowed: boolean; info: RateLimitInfo }`

**Example:**
```typescript
import { checkRateLimit } from './services/rateLimitService';

const { allowed, info } = checkRateLimit('user123', 'create_request');

if (!allowed) {
    console.error(`Rate limit exceeded. Try again at ${info.resetAt}`);
    return;
}

// Proceed with operation
```

#### `throttle(func, wait)`
Create a throttled version of a function.

**Example:**
```typescript
import { throttle } from './services/rateLimitService';

const throttledSearch = throttle((query) => {
    performSearch(query);
}, 1000);
```

---

## Session Management Service

### Purpose
Handle session timeout, auto-save drafts, and session recovery.

### Key Functions

#### `createSession(userId)`
Create a new user session.

**Returns:** `Session`

#### `saveDraft(type, data, draftId?)`
Save a draft.

**Parameters:**
- `type`: 'material_request' | 'wo_selection' | 'form'
- `data`: any
- `draftId`: string (optional)

**Returns:** `DraftData`

**Example:**
```typescript
import { saveDraft, getAllDrafts } from './services/sessionService';

// Save draft
const draft = saveDraft('material_request', {
    items: [...],
    deliveryLocation: 'Weld Shop'
});

// Recover drafts
const drafts = getAllDrafts('material_request');
```

#### `initializeSessionManagement(userId)`
Initialize session management for a user.

---

## Offline Support Service

### Purpose
Enable offline functionality with cached data and queued operations.

### Key Functions

#### `queueOfflineOperation(type, endpoint, data)`
Queue an operation to be executed when back online.

**Parameters:**
- `type`: 'create' | 'update' | 'delete'
- `endpoint`: String
- `data`: any

**Returns:** `string` (operation ID)

**Example:**
```typescript
import { queueOfflineOperation, isOnline } from './services/offlineService';

if (!isOnline()) {
    queueOfflineOperation('create', '/api/requests', requestData);
    console.log('Request queued for when back online');
} else {
    await createRequest(requestData);
}
```

#### `processOfflineQueue()`
Process all queued operations (automatically called when back online).

**Returns:** `Promise<void>`

#### `initializeOfflineSupport()`
Initialize offline support (call on app startup).

---

## Integration Examples

### Example 1: Complete Request Submission Flow

```typescript
import { checkRateLimit } from './services/rateLimitService';
import { triggerNotification } from './services/notificationService';
import { sendToLTR } from './services/ltrIntegrationService';
import { queueOfflineOperation, isOnline } from './services/offlineService';

async function submitRequest(userId: string, requestData: any) {
    // Check rate limit
    const { allowed } = checkRateLimit(userId, 'create_request');
    if (!allowed) {
        throw new Error('Rate limit exceeded');
    }

    // Handle offline
    if (!isOnline()) {
        const opId = queueOfflineOperation('create', '/api/requests', requestData);
        return { id: opId, status: 'queued' };
    }

    // Create request
    const request = await createRequest(requestData);

    // Send notifications
    await triggerNotification('submitted', {
        mrfId: request.id,
        requestorName: requestData.requestorName,
        priority: requestData.priority,
        // ... other variables
    });

    // Send to LTR if staging or higher
    if (request.status !== 'Submitted') {
        await sendToLTR(
            request.id,
            'Warehouse 1',
            requestData.deliveryLocation,
            requestData.priority,
            requestData.items.length
        );
    }

    return request;
}
```

### Example 2: Auto-save with Session Management

```typescript
import { startAutoSave, saveDraft } from './services/sessionService';

function initializeFormAutoSave(formData: any) {
    startAutoSave(() => {
        saveDraft('material_request', {
            ...formData,
            lastSaved: new Date().toISOString()
        });
        console.log('Draft auto-saved');
    });
}
```

---

## Configuration

### Environment Variables

```env
# SharePoint
SHAREPOINT_SITE_URL=https://toll.sharepoint.com/sites/scm
SHAREPOINT_LIST_ID=master-data
SHAREPOINT_CLIENT_ID=...

# LTR Integration
LTR_API_URL=https://ltr.toll.com/api
LTR_API_KEY=...

# Email (SendGrid)
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=noreply@toll.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+61...

# Teams
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
```

---

## Error Handling

All services follow consistent error handling:

```typescript
try {
    await sendNotification(...);
} catch (error) {
    if (error.message.includes('Rate limit')) {
        // Handle rate limit error
    } else if (error.message.includes('Network')) {
        // Handle network error - queue for offline
    } else {
        // Handle other errors
    }
}
```

---

## Testing

### Unit Tests

```bash
npm run test:services
```

### Integration Tests

```bash
npm run test:integration
```

### Manual Testing

Use the Integrations UI dashboard at `/integrations` (MC Control Panel → Integrations).

---

## Support

For issues or questions:
- **Email:** scmhub-support@toll.com
- **Teams:** SCM Hub Support Channel
- **Documentation:** https://scmhub.toll.com/docs

---

**Last Updated:** 2025-10-09  
**Version:** 1.0.0  
**Maintained by:** Agent 3 - Integrations & Infrastructure
