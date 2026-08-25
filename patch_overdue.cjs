const fs = require('fs');
let code = fs.readFileSync('api/process-notifications.ts', 'utf8');

// 1. Add new variables
const varsTarget = `  let overdueEvaluated = 0;
  let overdueDue = 0;
  let dailySummariesEvaluated = 0;`;
const varsReplacement = `  let overdueEvaluated = 0;
  let overdueDue = 0;
  let overdueAlreadySent = 0;
  let overdueSelected = 0;
  let overdueSendAttempts = 0;
  let overdueSendSuccesses = 0;
  let overdueSendFailures = 0;
  let dailySummariesEvaluated = 0;`;

code = code.replace(varsTarget, varsReplacement);

// 2. Add to return JSON
const returnTarget = `      overdueEvaluated,
      overdueDue,
      dailySummariesEvaluated,`;
const returnReplacement = `      overdueEvaluated,
      overdueDue,
      overdueAlreadySent,
      overdueSelected,
      overdueSendAttempts,
      overdueSendSuccesses,
      overdueSendFailures,
      dailySummariesEvaluated,`;
      
code = code.replace(returnTarget, returnReplacement);

// 3. Replace overdue logic
const overdueTarget = `      stage = 'overdue-eval';
      if (settings.notifications.overdueAlerts) {
         let overdueDueInner = 0;
         let overdueSent = 0;
         for (const task of tasks as any[]) {
           if (task.status === 'Completed' || task.status === 'Cancelled' || task.status === 'Skipped' || !task.endTime || !task.date) continue;
           if (task.date !== localDateStr && task.date !== tomorrowStr) {
               const yesterdayStr = formatInTimeZone(new Date(now.getTime() - 86400000), tz, 'yyyy-MM-dd');
               if (task.date !== yesterdayStr) continue;
           }
           tasksEvaluated++; overdueEvaluated++;
           
           stage = 'overdue-timezone';
           try {
             const taskEndUTC = fromZonedTime(\`\${task.date}T\${task.endTime}:00\`, tz);
             const diffMs = now.getTime() - taskEndUTC.getTime();
             const diffMins = Math.floor(diffMs / 60000);
             
             if (diffMins >= 0 && diffMins <= 1440) {
                overdueDueInner++;
                overdueDue++;
                const eventId = \`overdue_\${task.id}_\${task.date}_\${task.endTime}\`;
                stage = 'overdue-send';
                const sent = await sendUserPush(eventId, 'FlowState', \`Công việc đã quá hạn: \${task.title}\`, '/tasks');
                if (sent) overdueSent++;
             }
           } catch(e) {
           }
         }
      }`;

const overdueReplacement = `      stage = 'overdue-eval';
      if (settings.notifications.overdueAlerts) {
         let overdueSent = 0;
         const overdueTasks: any[] = [];
         
         for (const task of tasks as any[]) {
           if (task.status === 'Completed' || task.status === 'Cancelled' || task.status === 'Skipped' || !task.endTime || !task.date) continue;
           if (task.date !== localDateStr && task.date !== tomorrowStr) {
               const yesterdayStr = formatInTimeZone(new Date(now.getTime() - 86400000), tz, 'yyyy-MM-dd');
               if (task.date !== yesterdayStr) continue;
           }
           tasksEvaluated++; overdueEvaluated++;
           
           stage = 'overdue-timezone';
           try {
             const taskEndUTC = fromZonedTime(\`\${task.date}T\${task.endTime}:00\`, tz);
             const diffMs = now.getTime() - taskEndUTC.getTime();
             const diffMins = Math.floor(diffMs / 60000);
             
             if (diffMins >= 0 && diffMins <= 1440) {
                overdueDue++;
                const eventId = \`overdue_\${task.id}_\${task.date}_\${task.endTime}\`;
                overdueTasks.push({ task, taskEndUTC, eventId });
             }
           } catch(e) {
           }
         }
         
         if (overdueTasks.length > 0) {
             overdueTasks.sort((a, b) => b.taskEndUTC.getTime() - a.taskEndUTC.getTime());
             
             for (const { task, eventId } of overdueTasks) {
                 stage = 'overdue-check-event';
                 const eventRef = db.doc(\`users/\${userDoc.id}/notificationEvents/\${eventId}\`);
                 const eventDoc = await eventRef.get();
                 if (eventDoc.exists) {
                     overdueAlreadySent++;
                     continue;
                 }
                 
                 overdueSelected++;
                 stage = 'overdue-send';
                 overdueSendAttempts++;
                 const sent = await sendUserPush(eventId, 'FlowState', \`Công việc đã quá hạn: \${task.title}\`, '/tasks');
                 if (sent) {
                     overdueSendSuccesses++;
                     overdueSent++;
                     break;
                 } else {
                     overdueSendFailures++;
                     break;
                 }
             }
         }
      }`;

code = code.replace(overdueTarget, overdueReplacement);

fs.writeFileSync('api/process-notifications.ts', code);
console.log("Patched overdue logic");
