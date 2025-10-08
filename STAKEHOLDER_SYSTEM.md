# SCM Hub - Stakeholder & Notification System

**Generated:** 2025-10-08  
**Based On:** Business Logic Questionnaire  
**Version:** 1.0

---

## 🎯 OVERVIEW

The Stakeholder System allows MC to define **who gets notified** about **what events** via **which channels**.

**Key Features:**
- Flexible stakeholder lists (Project Managers, Safety Team, etc.)
- Per-person notification preferences (email, SMS, in-app, Teams)
- Event-based notification rules
- Configurable in MC backend
- Ready for future integrations (email, SMS, Teams, push)

---

## 📋 DATA STRUCTURES

### Stakeholder

```typescript
interface Stakeholder {
  id: string;                    // Unique ID
  name: string;                  // "John Smith"
  email: string;                 // "john@example.com"
  phone?: string;                // "+1-555-0100" (for SMS)
  role?: string;                 // "Project Manager", "Safety Officer", etc.
  
  // Notification preferences
  notificationPreferences: {
    email: boolean;              // Receive email notifications?
    sms: boolean;                // Receive SMS notifications?
    inApp: boolean;              // Receive in-app notifications?
    teams: boolean;              // Receive Teams notifications?
    push: boolean;               // Receive mobile push notifications?
  };
  
  // Availability (optional - future feature)
  availability?: {
    enabled: boolean;
    schedule: {
      monday: { start: string; end: string; };
      tuesday: { start: string; end: string; };
      // ... other days
    };
  };
  
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}
```

### Stakeholder List

```typescript
interface StakeholderList {
  id: string;                    // Unique ID
  name: string;                  // "Project Managers", "Safety Team"
  description?: string;          // Purpose of this list
  stakeholders: string[];        // Array of stakeholder IDs
  
  // Auto-subscribe to events
  autoNotifyOn: NotificationEvent[];
  
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}
```

### Notification Event Types

```typescript
type NotificationEvent = 
  | 'request_created'            // Any request created
  | 'request_created_p1'         // P1 request created
  | 'request_submitted'          // Request submitted (after draft)
  | 'request_status_changed'     // Any status change
  | 'request_picking_started'    // Picking started
  | 'request_staged'             // Staged for pickup
  | 'request_in_transit'         // In transit
  | 'request_delivered'          // Delivered
  | 'request_overdue'            // Past required date
  | 'request_on_hold'            // Put on hold
  | 'request_cancelled'          // Cancelled
  | 'partial_pick'               // Partial pick occurred
  | 'partial_pick_open'          // Partial pick - still searching
  | 'partial_pick_closed'        // Partial pick - items unavailable
  | 'request_split'              // Request split into multiple
  | 'material_locked'            // Material locked by AC
  | 'material_unlocked'          // Material unlocked
  | 'toll_accepted'              // Toll accepted delivery
  | 'toll_eta_updated'           // Toll updated ETA
  | 'delivery_location_changed'  // Delivery location changed
  | 'pod_override'               // POD submitted without photo/sig
  | 'status_backwards'           // Status moved backwards
  | 'priority_changed'           // Priority changed
  | 'mc_override'                // MC used override/bypass
  | 'approval_needed'            // Request needs approval
  | 'data_sync_conflict'         // SharePoint sync conflict
  | 'system_error';              // System error occurred
```

### Notification Rule

```typescript
interface NotificationRule {
  id: string;
  name: string;                  // "Notify PMs on P1 requests"
  description?: string;
  enabled: boolean;
  
  // When to trigger
  event: NotificationEvent;
  conditions?: {
    priority?: ('P1' | 'P2' | 'P3' | 'P4')[];
    status?: string[];
    overdue?: boolean;
    requestedBy?: string[];      // Specific users
    deliveryLocation?: string[];
    // ... other conditions
  };
  
  // Who to notify
  stakeholderLists: string[];    // List IDs
  additionalStakeholders?: string[]; // Individual stakeholder IDs
  
  // How to notify
  channels: ('email' | 'sms' | 'inApp' | 'teams' | 'push')[];
  
  // What to send
  template: string;              // Template ID or inline template
  
  // Throttling (prevent spam)
  throttle?: {
    enabled: boolean;
    maxPerHour: number;
  };
  
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}
```

### Notification Template

```typescript
interface NotificationTemplate {
  id: string;
  name: string;
  event: NotificationEvent;
  
  // Templates for each channel
  email?: {
    subject: string;             // Supports {{variables}}
    body: string;                // Supports {{variables}}
    bodyHtml?: string;           // Optional HTML version
  };
  
  sms?: {
    message: string;             // Max 160 chars, supports {{variables}}
  };
  
  inApp?: {
    title: string;
    message: string;
    icon?: string;               // Icon name or emoji
    actionUrl?: string;          // Deep link to request/item
  };
  
  teams?: {
    title: string;
    message: string;
    facts?: { name: string; value: string; }[]; // Teams card facts
    actionUrl?: string;
  };
  
  push?: {
    title: string;
    body: string;
    data?: any;                  // Custom data payload
  };
  
  // Available variables
  variables: string[];           // ['mrfId', 'requestor', 'priority', ...]
  
  createdAt: string;
  createdBy: string;
}
```

### Notification Log

```typescript
interface NotificationLog {
  id: string;
  timestamp: string;
  
  // What triggered it
  event: NotificationEvent;
  relatedEntity: {
    type: 'request' | 'lineitem' | 'material' | 'user';
    id: string;
  };
  
  // Who was notified
  recipients: {
    stakeholderId: string;
    name: string;
    email?: string;
    phone?: string;
  }[];
  
  // How they were notified
  channels: {
    channel: 'email' | 'sms' | 'inApp' | 'teams' | 'push';
    status: 'sent' | 'failed' | 'pending' | 'skipped';
    sentAt?: string;
    error?: string;
  }[];
  
  // What was sent
  template: string;
  renderedContent: {
    subject?: string;
    message: string;
  };
  
  // Rule that triggered it
  ruleId?: string;
  ruleName?: string;
}
```

---

## 🎨 MC BACKEND UI

### 1. Stakeholder Management

```
┌─────────────────────────────────────────────────────────┐
│ Stakeholders                                    [+ New] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Search: [________________] Filter: [All Roles ▼]        │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Name             Email              Role        │   │
│ ├─────────────────────────────────────────────────┤   │
│ │ John Smith       john@ex.com        PM     [⚙️] │   │
│ │   📧 ✓  📱 ✗  📲 ✓  👥 ✓  🔔 ✓              │   │
│ │                                                 │   │
│ │ Sarah Johnson    sarah@ex.com       Safety [⚙️] │   │
│ │   📧 ✓  📱 ✓  📲 ✓  👥 ✗  🔔 ✓              │   │
│ │                                                 │   │
│ │ Mike Davis       mike@ex.com        AC     [⚙️] │   │
│ │   📧 ✓  📱 ✗  📲 ✓  👥 ✓  🔔 ✗              │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Legend: 📧 Email | 📱 SMS | 📲 In-App | 👥 Teams | 🔔 Push │
│                                                         │
│ Total: 3 stakeholders                                   │
└─────────────────────────────────────────────────────────┘
```

**Add/Edit Stakeholder Modal:**
```
┌────────────────────────────────────────────────────┐
│ Add Stakeholder                          [✕ Close] │
├────────────────────────────────────────────────────┤
│                                                    │
│ Name: *                                            │
│ [John Smith_____________________________]          │
│                                                    │
│ Email: *                                           │
│ [john.smith@example.com_________________]          │
│                                                    │
│ Phone: (for SMS)                                   │
│ [+1 (555) 123-4567______________________]          │
│                                                    │
│ Role:                                              │
│ [Project Manager ▼]                                │
│ (Or type custom: _______________________)          │
│                                                    │
│ Notification Preferences:                          │
│ ☑ Email                                            │
│ ☐ SMS (phone required)                             │
│ ☑ In-App                                           │
│ ☑ Microsoft Teams                                  │
│ ☑ Mobile Push                                      │
│                                                    │
│ ☐ Set availability schedule (optional)             │
│                                                    │
│ [Cancel] [Save Stakeholder]                        │
└────────────────────────────────────────────────────┘
```

---

### 2. Stakeholder Lists

```
┌─────────────────────────────────────────────────────────┐
│ Stakeholder Lists                               [+ New] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ List Name              Members   Auto-Notify    │   │
│ ├─────────────────────────────────────────────────┤   │
│ │ 📋 Project Managers      5       P1 Created  [⚙️]│   │
│ │                                   Overdue          │   │
│ │                                                    │   │
│ │ 🔒 Safety Team           3       P1 Created  [⚙️]│   │
│ │                                   Partial Pick      │   │
│ │                                                    │   │
│ │ 🚨 Emergency Contacts    2       P1 Created  [⚙️]│   │
│ │                                   All Status        │   │
│ │                                                    │   │
│ │ 📊 Executives            4       Daily Summary [⚙️]│   │
│ │                                                    │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Total: 4 lists                                          │
└─────────────────────────────────────────────────────────┘
```

**Edit List Modal:**
```
┌────────────────────────────────────────────────────┐
│ Edit List: Project Managers              [✕ Close] │
├────────────────────────────────────────────────────┤
│                                                    │
│ List Name: *                                       │
│ [Project Managers_______________________]          │
│                                                    │
│ Description:                                       │
│ [All project managers who need to track____]       │
│ [material requests for their projects_____]        │
│                                                    │
│ Members: (5)                                       │
│ ┌────────────────────────────────────────────┐   │
│ │ ☑ John Smith (PM) [john@ex.com]      [✕]  │   │
│ │ ☑ Sarah Johnson (PM) [sarah@ex.com]  [✕]  │   │
│ │ ☑ Mike Davis (PM) [mike@ex.com]      [✕]  │   │
│ │ ☑ Lisa Wong (PM) [lisa@ex.com]       [✕]  │   │
│ │ ☑ Tom Brown (PM) [tom@ex.com]        [✕]  │   │
│ └────────────────────────────────────────────┘   │
│ [+ Add Member ▼]                                   │
│                                                    │
│ Auto-Notify On:                                    │
│ ☑ P1 Request Created                               │
│ ☑ Request Overdue                                  │
│ ☑ Partial Pick Occurs                              │
│ ☐ Request Cancelled                                │
│ ☐ Delivery Complete                                │
│ ☐ All Requests                                     │
│ [+ Custom Rule]                                    │
│                                                    │
│ [Delete List] [Cancel] [Save Changes]              │
└────────────────────────────────────────────────────┘
```

---

### 3. Notification Rules

```
┌─────────────────────────────────────────────────────────┐
│ Notification Rules                              [+ New] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ☑ Enabled  ☐ Disabled Only                             │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ✓ Notify PMs on P1 Requests                [⚙️] │   │
│ │   Event: P1 Request Created                       │   │
│ │   To: Project Managers (5)                        │   │
│ │   Via: Email, In-App, Teams                       │   │
│ │                                                    │   │
│ │ ✓ Safety Team - Partial Picks           [⚙️] │   │
│ │   Event: Partial Pick                             │   │
│ │   To: Safety Team (3)                             │   │
│ │   Via: Email, SMS, In-App                         │   │
│ │                                                    │   │
│ │ ✗ Daily Summary to Executives           [⚙️] │   │
│ │   Event: Daily at 5 PM                            │   │
│ │   To: Executives (4)                              │   │
│ │   Via: Email                                      │   │
│ │   (Disabled - click to enable)                    │   │
│ │                                                    │   │
│ │ ✓ Overdue Escalation                     [⚙️] │   │
│ │   Event: Request Overdue                          │   │
│ │   To: Project Managers (5) + MC                   │   │
│ │   Via: Email, SMS, Push                           │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Total: 4 rules (3 enabled, 1 disabled)                  │
└─────────────────────────────────────────────────────────┘
```

**Edit Rule Modal:**
```
┌────────────────────────────────────────────────────┐
│ Edit Rule: Notify PMs on P1 Requests    [✕ Close] │
├────────────────────────────────────────────────────┤
│                                                    │
│ Rule Name: *                                       │
│ [Notify PMs on P1 Requests______________]          │
│                                                    │
│ ☑ Enabled                                          │
│                                                    │
│ Trigger Event: *                                   │
│ [P1 Request Created ▼]                             │
│                                                    │
│ Conditions: (optional)                             │
│ ┌────────────────────────────────────────────┐   │
│ │ Priority:     ☑ P1  ☐ P2  ☐ P3  ☐ P4       │   │
│ │ Status:       ☐ Any  ☐ Specific: [____]    │   │
│ │ Requested By: ☐ Any  ☐ Specific: [____]    │   │
│ │ Overdue:      ☐ Yes  ☐ No  ☑ Either        │   │
│ └────────────────────────────────────────────┘   │
│                                                    │
│ Notify: *                                          │
│ Stakeholder Lists:                                 │
│ ☑ Project Managers (5 people)                      │
│ ☐ Safety Team (3 people)                           │
│ ☐ Emergency Contacts (2 people)                    │
│                                                    │
│ Additional Stakeholders:                           │
│ [+ Add Individual ▼]                               │
│                                                    │
│ Channels: *                                        │
│ ☑ Email                                            │
│ ☐ SMS                                              │
│ ☑ In-App Notification                              │
│ ☑ Microsoft Teams                                  │
│ ☐ Mobile Push                                      │
│                                                    │
│ Template:                                          │
│ [P1 Request Created (Default) ▼] [Preview]        │
│ or [Create Custom Template]                        │
│                                                    │
│ Throttling:                                        │
│ ☐ Limit notifications to [10] per hour             │
│                                                    │
│ [Test Rule] [Delete Rule] [Cancel] [Save]          │
└────────────────────────────────────────────────────┘
```

---

### 4. Notification Templates

```
┌─────────────────────────────────────────────────────────┐
│ Notification Templates                          [+ New] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Search: [________________] Event: [All Events ▼]        │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Template Name          Event          Channels   │   │
│ ├─────────────────────────────────────────────────┤   │
│ │ P1 Request Created     P1 Created     📧 📲 👥 [⚙️]│   │
│ │ Partial Pick Alert     Partial Pick   📧 📱 📲 [⚙️]│   │
│ │ Delivery Complete      Delivered      📲      [⚙️]│   │
│ │ Overdue Escalation     Overdue        📧 📱   [⚙️]│   │
│ │ Daily Summary          Daily          📧      [⚙️]│   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Total: 5 templates                                      │
└─────────────────────────────────────────────────────────┘
```

**Edit Template Modal:**
```
┌────────────────────────────────────────────────────┐
│ Edit Template: P1 Request Created       [✕ Close] │
├────────────────────────────────────────────────────┤
│                                                    │
│ Template Name: *                                   │
│ [P1 Request Created_____________________]          │
│                                                    │
│ Event: *                                           │
│ [P1 Request Created ▼]                             │
│                                                    │
│ Available Variables:                               │
│ {{mrfId}} {{requestor}} {{priority}} {{requiredBy}}│
│ {{itemCount}} {{deliveryLocation}} {{workOrder}}  │
│ {{currentDate}} {{currentTime}}                    │
│ [View All Variables]                               │
│                                                    │
│ ┌──────────────────────────────────────────────┐ │
│ │ 📧 Email Template                            │ │
│ ├──────────────────────────────────────────────┤ │
│ │ Subject:                                     │ │
│ │ [🚨 P1 Request {{mrfId}} Created________]    │ │
│ │                                              │ │
│ │ Body:                                        │ │
│ │ ┌──────────────────────────────────────┐   │ │
│ │ │ A new P1 (Critical) material request  │   │ │
│ │ │ has been created:                     │   │ │
│ │ │                                       │   │ │
│ │ │ Request ID: {{mrfId}}                 │   │ │
│ │ │ Requested By: {{requestor}}           │   │ │
│ │ │ Required By: {{requiredBy}}           │   │ │
│ │ │ Items: {{itemCount}}                  │   │ │
│ │ │ Delivery: {{deliveryLocation}}        │   │ │
│ │ │                                       │   │ │
│ │ │ View request: {{requestUrl}}          │   │ │
│ │ └──────────────────────────────────────┘   │ │
│ │                                              │ │
│ │ ☐ Use HTML version (rich formatting)        │ │
│ └──────────────────────────────────────────────┘ │
│                                                    │
│ ┌──────────────────────────────────────────────┐ │
│ │ 📲 In-App Template                           │ │
│ ├──────────────────────────────────────────────┤ │
│ │ Title:                                       │ │
│ │ [🚨 P1 Request {{mrfId}}____________]        │ │
│ │                                              │ │
│ │ Message:                                     │ │
│ │ [Created by {{requestor}}, due {{requiredBy}}]│ │
│ │                                              │ │
│ │ Icon: [🚨] Action URL: [/requests/{{mrfId}}] │ │
│ └──────────────────────────────────────────────┘ │
│                                                    │
│ ┌──────────────────────────────────────────────┐ │
│ │ 👥 Microsoft Teams Template                  │ │
│ ├──────────────────────────────────────────────┤ │
│ │ [Configure Teams Card ▼]                     │ │
│ └──────────────────────────────────────────────┘ │
│                                                    │
│ [Preview] [Test Send] [Cancel] [Save Template]    │
└────────────────────────────────────────────────────┘
```

---

### 5. Notification Log

```
┌─────────────────────────────────────────────────────────┐
│ Notification Log                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Date: [Last 7 Days ▼]  Event: [All ▼]  Status: [All ▼] │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Time        Event         Recipients  Status    │   │
│ ├─────────────────────────────────────────────────┤   │
│ │ 2:45 PM     P1 Created    5 people    ✓ Sent [📋]│   │
│ │             MRF-1234      📧 ✓ 📲 ✓ 👥 ✓           │   │
│ │                                                    │   │
│ │ 2:30 PM     Partial Pick  3 people    ✓ Sent [📋]│   │
│ │             MRF-1230      📧 ✓ 📱 ✗ 📲 ✓           │   │
│ │                           (SMS failed)             │   │
│ │                                                    │   │
│ │ 1:15 PM     Delivered     1 person    ✓ Sent [📋]│   │
│ │             MRF-1228      📲 ✓                     │   │
│ │                                                    │   │
│ │ 12:00 PM    Overdue       7 people    ⏳ Pending[📋]│   │
│ │             MRF-1220      📧 ⏳ 📱 ⏳                │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ [Export CSV] [Clear Old Logs]                           │
│                                                         │
│ Total: 342 notifications today (338 sent, 4 failed)     │
└─────────────────────────────────────────────────────────┘
```

**Log Detail Modal:**
```
┌────────────────────────────────────────────────────┐
│ Notification Detail                      [✕ Close] │
├────────────────────────────────────────────────────┤
│                                                    │
│ Event: P1 Request Created                          │
│ Triggered: 10/8/2025 2:45 PM                       │
│ Related: MRF-1234                                  │
│ Rule: Notify PMs on P1 Requests                    │
│                                                    │
│ Recipients: (5)                                    │
│ ┌────────────────────────────────────────────┐   │
│ │ 📧 Email to john@ex.com       ✓ Sent 2:45PM│   │
│ │    John Smith (PM)                          │   │
│ │                                             │   │
│ │ 📧 Email to sarah@ex.com      ✓ Sent 2:45PM│   │
│ │ 📲 In-App to Sarah Johnson    ✓ Sent 2:45PM│   │
│ │ 👥 Teams to Sarah Johnson     ✓ Sent 2:46PM│   │
│ │                                             │   │
│ │ 📧 Email to mike@ex.com       ✓ Sent 2:45PM│   │
│ │ 📲 In-App to Mike Davis       ✓ Sent 2:45PM│   │
│ │                                             │   │
│ │ ... (2 more)                                │   │
│ └────────────────────────────────────────────┘   │
│                                                    │
│ Template Used: P1 Request Created (Default)        │
│                                                    │
│ Content Sent:                                      │
│ ┌────────────────────────────────────────────┐   │
│ │ Subject: 🚨 P1 Request MRF-1234 Created    │   │
│ │                                             │   │
│ │ A new P1 (Critical) material request has    │   │
│ │ been created:                               │   │
│ │                                             │   │
│ │ Request ID: MRF-1234                        │   │
│ │ Requested By: Jane Doe                      │   │
│ │ Required By: 10/8/2025 5:00 PM              │   │
│ │ Items: 4                                    │   │
│ │ Delivery: Unit 12 Work Area                 │   │
│ │                                             │   │
│ │ View request: https://...                   │   │
│ └────────────────────────────────────────────┘   │
│                                                    │
│ [Resend] [Close]                                   │
└────────────────────────────────────────────────────┘
```

---

## 🔧 NOTIFICATION CHANNELS

### 1. Email (Priority: 🟡 Important)

**Service:** SMTP / SendGrid / AWS SES

**Implementation:**
```typescript
async function sendEmail(notification: NotificationPayload) {
  const { recipients, subject, message } = notification;
  
  for (const recipient of recipients) {
    try {
      await emailService.send({
        to: recipient.email,
        subject: subject,
        text: message,
        html: renderHtmlTemplate(message), // Optional HTML version
      });
      
      logNotification(recipient, 'email', 'sent');
    } catch (error) {
      logNotification(recipient, 'email', 'failed', error);
    }
  }
}
```

**Configuration (MC Backend):**
```
Email Settings
┌──────────────────────────────────────────┐
│ Service: [SMTP ▼]                        │
│                                          │
│ SMTP Server: [smtp.example.com____]      │
│ Port: [587]                              │
│ Username: [notifications@example.com__]  │
│ Password: [••••••••••]                   │
│                                          │
│ From Name: [SCM Hub______________]       │
│ From Email: [noreply@example.com___]     │
│                                          │
│ [Test Connection] [Save]                 │
└──────────────────────────────────────────┘
```

---

### 2. SMS (Priority: 🟡 Important)

**Service:** Twilio / AWS SNS

**Implementation:**
```typescript
async function sendSMS(notification: NotificationPayload) {
  const { recipients, message } = notification;
  
  // Truncate to 160 chars
  const smsMessage = truncate(message, 160);
  
  for (const recipient of recipients) {
    if (!recipient.phone) {
      logNotification(recipient, 'sms', 'skipped', 'No phone number');
      continue;
    }
    
    try {
      await twilioClient.messages.create({
        to: recipient.phone,
        from: config.twilioNumber,
        body: smsMessage,
      });
      
      logNotification(recipient, 'sms', 'sent');
    } catch (error) {
      logNotification(recipient, 'sms', 'failed', error);
    }
  }
}
```

**Configuration (MC Backend):**
```
SMS Settings
┌──────────────────────────────────────────┐
│ Service: [Twilio ▼]                      │
│                                          │
│ Account SID: [AC••••••••••••••••••]      │
│ Auth Token: [••••••••••]                 │
│ From Number: [+1-555-0199_______]        │
│                                          │
│ ☑ Truncate long messages to 160 chars   │
│ ☐ Send as MMS for longer messages        │
│                                          │
│ [Test SMS] [Save]                        │
└──────────────────────────────────────────┘
```

---

### 3. In-App Notifications (Priority: 🔴 Critical)

**Implementation:**
```typescript
interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

async function sendInApp(notification: NotificationPayload) {
  const { recipients, subject, message, data } = notification;
  
  for (const recipient of recipients) {
    const inAppNotif: InAppNotification = {
      id: generateId(),
      userId: recipient.id,
      title: subject,
      message: message,
      icon: data?.icon || '📋',
      actionUrl: data?.actionUrl,
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    // Save to database
    await db.notifications.insert(inAppNotif);
    
    // Send via WebSocket (real-time)
    websocketService.sendToUser(recipient.id, {
      type: 'notification',
      data: inAppNotif,
    });
    
    logNotification(recipient, 'inApp', 'sent');
  }
}
```

**UI Component:**
```typescript
// Header bell icon
function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <button onClick={() => setShowPanel(true)}>
      🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
    </button>
  );
}
```

---

### 4. Microsoft Teams (Priority: 🟢 Nice-to-Have)

**Service:** Teams Incoming Webhooks

**Implementation:**
```typescript
async function sendTeams(notification: NotificationPayload) {
  const { recipients, subject, message, data } = notification;
  
  const card = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": subject,
    "themeColor": "0078D4",
    "title": subject,
    "sections": [{
      "activityTitle": message,
      "facts": data?.facts || [],
    }],
    "potentialAction": data?.actionUrl ? [{
      "@type": "OpenUri",
      "name": "View Request",
      "targets": [{
        "os": "default",
        "uri": data.actionUrl
      }]
    }] : []
  };
  
  for (const recipient of recipients) {
    if (!recipient.teamsWebhook) {
      logNotification(recipient, 'teams', 'skipped', 'No webhook');
      continue;
    }
    
    try {
      await axios.post(recipient.teamsWebhook, card);
      logNotification(recipient, 'teams', 'sent');
    } catch (error) {
      logNotification(recipient, 'teams', 'failed', error);
    }
  }
}
```

**Configuration (Per Stakeholder):**
```
Teams Integration
┌──────────────────────────────────────────┐
│ Stakeholder: John Smith                  │
│                                          │
│ Teams Webhook URL:                       │
│ [https://outlook.office.com/webhook/___] │
│ [____________@@@...____________________] │
│                                          │
│ [Test Webhook] [Save]                    │
└──────────────────────────────────────────┘
```

---

### 5. Mobile Push (Priority: 🟢 Nice-to-Have)

**Service:** Firebase Cloud Messaging (FCM) / Apple Push Notification (APNS)

**Implementation:**
```typescript
async function sendPush(notification: NotificationPayload) {
  const { recipients, subject, message, data } = notification;
  
  for (const recipient of recipients) {
    const deviceTokens = await getDeviceTokens(recipient.id);
    
    if (deviceTokens.length === 0) {
      logNotification(recipient, 'push', 'skipped', 'No devices');
      continue;
    }
    
    try {
      await fcm.sendMulticast({
        tokens: deviceTokens,
        notification: {
          title: subject,
          body: message,
        },
        data: data,
      });
      
      logNotification(recipient, 'push', 'sent');
    } catch (error) {
      logNotification(recipient, 'push', 'failed', error);
    }
  }
}
```

---

## 📋 DEFAULT NOTIFICATION RULES

When system first deployed, create these default rules:

### 1. P1 Request Created
- **Event:** `request_created_p1`
- **To:** Project Managers list + MC
- **Channels:** Email, In-App, Teams
- **Template:** P1 Alert

### 2. Request Overdue
- **Event:** `request_overdue`
- **To:** Project Managers list + Requestor
- **Channels:** Email, SMS, In-App
- **Template:** Overdue Alert

### 3. Partial Pick
- **Event:** `partial_pick`
- **To:** MC + Requestor
- **Channels:** Email, In-App
- **Template:** Partial Pick Alert

### 4. Delivery Complete
- **Event:** `request_delivered`
- **To:** Requestor
- **Channels:** In-App, Email
- **Template:** Delivery Confirmation

### 5. POD Override
- **Event:** `pod_override`
- **To:** Project Managers list + MC
- **Channels:** Email, SMS
- **Template:** POD Override Alert

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: In-App Only (MVP)
- ✅ In-app notification system
- ✅ Notification bell UI
- ✅ Basic stakeholder lists
- ✅ Hardcoded rules

**Files to Create:**
- `services/notification.ts` - Core service
- `components/NotificationBell.tsx`
- `components/NotificationPanel.tsx`
- `types/notification.ts`

---

### Phase 2: Email Integration
- ✅ SMTP configuration
- ✅ Email templates
- ✅ Email sending
- ✅ MC configuration UI

**Files to Create:**
- `services/email.ts`
- `features/mc-control/EmailSettings.tsx`

---

### Phase 3: Full Stakeholder System
- ✅ Stakeholder management UI
- ✅ Stakeholder lists UI
- ✅ Notification rules UI
- ✅ Template editor

**Files to Create:**
- `features/mc-control/stakeholders/` (directory)
  - `StakeholderManager.tsx`
  - `StakeholderListManager.tsx`
  - `NotificationRules.tsx`
  - `TemplateEditor.tsx`
  - `NotificationLog.tsx`

---

### Phase 4: Additional Channels
- ✅ SMS integration (Twilio)
- ✅ Teams integration (Webhooks)
- ✅ Mobile push (FCM/APNS)

**Files to Create:**
- `services/sms.ts`
- `services/teams.ts`
- `services/push.ts`

---

## 📝 TESTING CHECKLIST

### Stakeholder Management:
- [ ] Create stakeholder
- [ ] Edit stakeholder
- [ ] Delete stakeholder
- [ ] Set notification preferences
- [ ] Create stakeholder list
- [ ] Add members to list
- [ ] Remove members from list

### Notification Rules:
- [ ] Create rule
- [ ] Edit rule
- [ ] Enable/disable rule
- [ ] Test rule (dry run)
- [ ] Delete rule
- [ ] Rule triggers correctly on event
- [ ] Conditions filter correctly

### Notification Sending:
- [ ] In-app notification sent
- [ ] In-app notification displays in UI
- [ ] Email sent successfully
- [ ] SMS sent successfully
- [ ] Teams message sent
- [ ] Push notification sent
- [ ] Failed notifications logged
- [ ] Throttling works (rate limiting)

### Templates:
- [ ] Create template
- [ ] Edit template
- [ ] Variables render correctly
- [ ] Preview template
- [ ] Test send template

---

**End of Document**  
*For questions or changes, update this document and version number*

