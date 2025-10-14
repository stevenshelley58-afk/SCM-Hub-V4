import{s as n}from"./index-KlyCLaH2.js";class s{constructor(){this.queue=[],this.sentNotifications=[]}async sendNotification(e){const t={...e,notification_id:`notif_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,created_at:new Date().toISOString(),status:"pending"};return this.queue.push(t),console.log("📧 Notification queued:",{type:t.type,event:t.event,recipient:t.recipient.name,priority:t.priority}),this.persistQueue(),t.notification_id}async notifyTaskAssigned(e,t){const i=n.getConfig();i.notifications.email.enabled&&(t.email&&await this.sendNotification({type:"email",event:"task.assigned",recipient:{id:t.driver_id,name:t.name,email:t.email},subject:`New Task Assigned: ${e.task_number}`,message:this.formatTaskAssignedEmail(e,t),data:{task_id:e.task_id,task_number:e.task_number},priority:e.priority==="critical"?"critical":"normal"}),i.notifications.sms.enabled&&t.phone&&await this.sendNotification({type:"sms",event:"task.assigned",recipient:{id:t.driver_id,name:t.name,phone:t.phone},message:`New task ${e.task_number}: ${e.description}. Pickup: ${e.pickup.location}`,data:{task_id:e.task_id},priority:e.priority==="critical"?"critical":"normal"}),e.requester.email&&await this.sendNotification({type:"email",event:"task.assigned",recipient:{name:e.requester.name,email:e.requester.email},subject:`Task Accepted: ${e.task_number}`,message:this.formatTaskAcceptedEmail(e,t),data:{task_id:e.task_id},priority:"normal"}))}async notifyTaskCompleted(e,t){n.getConfig().notifications.email.enabled&&e.requester.email&&await this.sendNotification({type:"email",event:"task.completed",recipient:{name:e.requester.name,email:e.requester.email},subject:`Task Completed: ${e.task_number}`,message:this.formatTaskCompletedEmail(e,t),data:{task_id:e.task_id,pod_id:t==null?void 0:t.pod_id},priority:"normal"})}async notifySLAWarning(e,t){const i=n.getConfig();i.sla_rules.alerts.warn_at_percentage&&(await this.sendNotification({type:"email",event:"sla.warning",recipient:{name:"MLC Team",email:"mlc-team@example.com"},subject:`⚠️ SLA Warning: ${e.task_number}`,message:`Task ${e.task_number} is at ${t}% of SLA time.

Priority: ${e.priority}
SLA Target: ${e.sla_target_at}

Please check the task.`,data:{task_id:e.task_id,percentage_used:t},priority:"high"}),i.notifications.teams.enabled&&await this.sendNotification({type:"teams",event:"sla.warning",recipient:{name:"MLC Team"},message:`⚠️ SLA Warning: Task ${e.task_number} is at ${t}% of SLA time.`,data:{task_id:e.task_id,task_url:`/logistics-dispatcher?task=${e.task_id}`},priority:"high"}))}async notifySLABreach(e){const t=n.getConfig();t.sla_rules.alerts.breach_notification&&(await this.sendNotification({type:"email",event:"sla.breach",recipient:{name:"MLC Team",email:"mlc-team@example.com"},subject:`🚨 SLA BREACH: ${e.task_number}`,message:`CRITICAL: Task ${e.task_number} has breached its SLA!

Priority: ${e.priority}
SLA Target: ${e.sla_target_at}
Status: ${e.status}

Immediate action required.`,data:{task_id:e.task_id},priority:"critical"}),t.notifications.sms.enabled&&await this.sendNotification({type:"sms",event:"sla.breach",recipient:{name:"MLC On-Call",phone:"+61400000000"},message:`🚨 SLA BREACH: ${e.task_number}. Check system immediately.`,data:{task_id:e.task_id},priority:"critical"}))}async notifyException(e,t,i){var a;n.getConfig(),await this.sendNotification({type:"email",event:"task.exception",recipient:{name:"MLC Team",email:"mlc-team@example.com"},subject:`⚠️ Exception: ${e.task_number}`,message:`Exception reported for task ${e.task_number}:

Type: ${t}
Description: ${i}

Driver: ${(a=e.driver)==null?void 0:a.name}
Location: ${e.pickup.location}`,data:{task_id:e.task_id,exception_type:t},priority:"high"}),e.requester.email&&await this.sendNotification({type:"email",event:"task.exception",recipient:{name:e.requester.name,email:e.requester.email},subject:`Issue with Task: ${e.task_number}`,message:`There's an issue with your logistics request ${e.task_number}.

Issue: ${i}

We're working to resolve it.`,data:{task_id:e.task_id},priority:"normal"})}async sendDailySummary(e){n.getConfig().notifications.email.enabled&&await this.sendNotification({type:"email",event:"daily.summary",recipient:{name:"MLC Team",email:"mlc-team@example.com"},subject:`Daily Logistics Summary - ${new Date().toLocaleDateString()}`,message:this.formatDailySummaryEmail(e),data:e,priority:"normal"})}getNotificationEndpoint(e){const t=this.queue.find(a=>a.notification_id===e);if(!t)return null;const i=n.getConfig();switch(t.type){case"email":return{endpoint_type:"email",url:"/api/notifications/email",method:"POST",headers:{"Content-Type":"application/json","X-API-Key":"your-api-key"},payload:{to:t.recipient.email,from:i.notifications.email.from_address,subject:t.subject,html:t.message,text:t.message}};case"sms":return{endpoint_type:"sms",url:"/api/notifications/sms",method:"POST",headers:{"Content-Type":"application/json","X-API-Key":"your-api-key"},payload:{to:t.recipient.phone,from:i.notifications.sms.from_number,message:t.message}};case"teams":return{endpoint_type:"teams",url:i.notifications.teams.webhook_url||"",method:"POST",headers:{"Content-Type":"application/json"},payload:{"@type":"MessageCard","@context":"https://schema.org/extensions",summary:t.subject||t.message,sections:[{activityTitle:t.subject||"Logistics Notification",activitySubtitle:t.message,facts:Object.entries(t.data).map(([a,o])=>({name:a,value:String(o)}))}]}};case"push":return{endpoint_type:"push",url:"/api/notifications/push",method:"POST",headers:{"Content-Type":"application/json"},payload:{title:t.subject||"Notification",body:t.message,data:t.data}};default:return null}}getPendingNotifications(){return this.queue.filter(e=>e.status==="pending")}markAsSent(e){const t=this.queue.find(i=>i.notification_id===e);t&&(t.status="sent",t.sent_at=new Date().toISOString(),this.sentNotifications.push(t),this.queue=this.queue.filter(i=>i.notification_id!==e),this.persistQueue())}markAsFailed(e,t){const i=this.queue.find(a=>a.notification_id===e);i&&(i.status="failed",i.error=t,this.persistQueue())}getHistory(e=100){return[...this.sentNotifications,...this.queue].sort((t,i)=>new Date(i.created_at).getTime()-new Date(t.created_at).getTime()).slice(0,e)}formatTaskAssignedEmail(e,t){return`
            <h2>New Task Assigned</h2>
            <p>Hi ${t.name},</p>
            <p>You have been assigned a new logistics task:</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #0066cc;">
                <strong>Task:</strong> ${e.task_number}<br>
                <strong>Priority:</strong> ${e.priority.toUpperCase()}<br>
                <strong>Type:</strong> ${e.type}<br>
                <strong>Description:</strong> ${e.description}<br><br>
                
                <strong>Pickup:</strong> ${e.pickup.location}<br>
                ${e.pickup.contact?`<strong>Contact:</strong> ${e.pickup.contact}<br>`:""}
                
                <strong>Dropoff:</strong> ${e.dropoff.location}<br>
                ${e.dropoff.contact?`<strong>Contact:</strong> ${e.dropoff.contact}<br>`:""}
                
                ${e.sla_target_at?`<br><strong>Complete By:</strong> ${new Date(e.sla_target_at).toLocaleString()}<br>`:""}
            </div>
            
            <p>Please check the driver app for full details.</p>
        `}formatTaskAcceptedEmail(e,t){return`
            <h2>Task Accepted</h2>
            <p>Hi ${e.requester.name},</p>
            <p>Your logistics request has been accepted and assigned to a driver:</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #44aa44;">
                <strong>Task:</strong> ${e.task_number}<br>
                <strong>Driver:</strong> ${t.name}<br>
                ${t.phone?`<strong>Driver Phone:</strong> ${t.phone}<br>`:""}
                <strong>Pickup Location:</strong> ${e.pickup.location}<br>
                <strong>Delivery Location:</strong> ${e.dropoff.location}<br>
                ${e.sla_target_at?`<strong>Expected Completion:</strong> ${new Date(e.sla_target_at).toLocaleString()}<br>`:""}
            </div>
            
            <p>You'll receive another notification when the delivery is completed.</p>
        `}formatTaskCompletedEmail(e,t){return`
            <h2>Task Completed</h2>
            <p>Hi ${e.requester.name},</p>
            <p>Your logistics request has been completed:</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #44aa44;">
                <strong>Task:</strong> ${e.task_number}<br>
                <strong>Completed At:</strong> ${e.completed_at?new Date(e.completed_at).toLocaleString():"N/A"}<br>
                ${t?`
                    <strong>Delivered To:</strong> ${t.delivered_to}<br>
                    ${t.photo_count?`<strong>Photos:</strong> ${t.photo_count} captured<br>`:""}
                    ${t.delivery_notes?`<strong>Notes:</strong> ${t.delivery_notes}<br>`:""}
                `:""}
            </div>
            
            <p>View the full proof of delivery in the system.</p>
        `}formatDailySummaryEmail(e){return`
            <h2>Daily Logistics Summary</h2>
            <p>Summary for ${new Date().toLocaleDateString()}:</p>
            
            <div style="background: #f9f9f9; padding: 15px;">
                <h3>Overview</h3>
                <strong>Total Tasks:</strong> ${e.total_tasks}<br>
                <strong>Completed:</strong> ${e.completed} (${e.total_tasks>0?Math.round(e.completed/e.total_tasks*100):0}%)<br>
                <strong>In Progress:</strong> ${e.in_progress}<br>
                <strong>Exceptions:</strong> ${e.exceptions}<br>
                <strong>SLA Compliance:</strong> ${e.sla_compliance}%<br>
            </div>
            
            <p>View detailed reports in the system.</p>
        `}persistQueue(){try{localStorage.setItem("notification_queue",JSON.stringify(this.queue)),localStorage.setItem("notification_history",JSON.stringify(this.sentNotifications.slice(-100)))}catch(e){console.error("Error persisting notification queue:",e)}}loadQueue(){try{const e=localStorage.getItem("notification_queue");e&&(this.queue=JSON.parse(e));const t=localStorage.getItem("notification_history");t&&(this.sentNotifications=JSON.parse(t))}catch(e){console.error("Error loading notification queue:",e)}}}const r=new s;r.loadQueue();export{r as notificationService};
