const fs = require('fs');
let code = fs.readFileSync('api/process-notifications.ts', 'utf8');

// Replace TaskReminder logic
const oldReminder = `      if (settings.notifications.taskReminders) {
        const reminderMins = settings.notifications.reminderTime || 5;
        let evaluated = 0;
        let selected = 0;
        
        for (const task of tasks) {
           if (task.status === 'Completed' || task.status === 'Cancelled' || !task.startTime || !task.date) continue;
           if (task.date !== localDateStr && task.date !== tomorrowStr) continue;
           
           evaluated++;
           
           if (!task.reminderEnabled) {
              logs.push(\`Task \${task.id} (\${task.title}): skipped, reminderEnabled is false\`);
              continue;
           }
           
           try {
             const taskStartUTC = fromZonedTime(\`\${task.date}T\${task.startTime}:00\`, tz);
             const diffMs = taskStartUTC.getTime() - now.getTime();
             const diffMins = Math.floor(diffMs / 60000);
             
             // Check if it falls in the window. We allow a slightly larger window for the 5-min cron
             // e.g. if diffMins is between 0 and reminderMins + 5
             if (diffMins >= 0 && diffMins <= reminderMins + 5) {
                const eventId = \`reminder_\${task.id}_\${task.date}_\${task.startTime}\`;
                const sent = await sendUserPush(eventId, 'FlowState', \`Công việc sắp bắt đầu: \${task.title}\`, '/tasks');
                if (sent) selected++;
                logs.push(\`Task \${task.id} (\${task.title}): reminderTime=\${formatInTimeZone(taskStartUTC, tz, 'HH:mm')}, now=\${formatInTimeZone(now, tz, 'HH:mm')}, diffMins=\${diffMins}, selected=true\`);
             } else {
                logs.push(\`Task \${task.id} (\${task.title}): diffMins=\${diffMins} outside window (0 to \${reminderMins + 5}), selected=false\`);
             }
           } catch (e: any) {
             logs.push(\`Task \${task.id} (\${task.title}): Error parsing time: \${e.message}\`);
           }
        }
        logs.push(\`TaskReminders: Evaluated \${evaluated}, Selected \${selected} (reminderMins=\${reminderMins})\`);
      }`;

const newReminder = `      if (settings.notifications.taskReminders) {
        const reminderMins = settings.notifications.reminderTime || 5;
        let evaluated = 0;
        let selected = 0;
        let remindersDue = 0;
        
        for (const task of tasks) {
           if (task.status === 'Completed' || task.status === 'Cancelled' || !task.startTime || !task.date) continue;
           if (task.date !== localDateStr && task.date !== tomorrowStr) continue;
           
           evaluated++;
           
           if (!task.reminderEnabled) {
              logs.push(\`Task \${task.id}: skipped (reminderEnabled false)\`);
              continue;
           }
           
           try {
             const taskStartUTC = fromZonedTime(\`\${task.date}T\${task.startTime}:00\`, tz);
             const reminderTimeUTC = new Date(taskStartUTC.getTime() - reminderMins * 60000);
             
             const diffMs = now.getTime() - reminderTimeUTC.getTime();
             const diffMins = Math.floor(diffMs / 60000);
             
             // If now is >= reminder time, and it's been less than 60 minutes since the reminder time.
             // This gives a safe window for the scheduler to catch up.
             if (diffMins >= 0 && diffMins <= 60) {
                remindersDue++;
                const eventId = \`reminder_\${task.id}_\${task.date}_\${task.startTime}_\${reminderMins}\`;
                const sent = await sendUserPush(eventId, 'FlowState', \`Công việc sắp bắt đầu: \${task.title}\`, '/tasks');
                if (sent) selected++;
                logs.push(\`Task \${task.id} (\${task.title}): reminderTime=\${formatInTimeZone(reminderTimeUTC, tz, 'HH:mm')}, diffMins=\${diffMins}, sent=\${sent}\`);
             } else {
                logs.push(\`Task \${task.id} (\${task.title}): skipped, reminderTime=\${formatInTimeZone(reminderTimeUTC, tz, 'HH:mm')}, diffMins=\${diffMins} outside window (0-60)\`);
             }
           } catch (e: any) {
             logs.push(\`Task \${task.id}: Error parsing time \${e.message}\`);
           }
        }
        logs.push(\`TaskReminders: Evaluated \${evaluated}, Due \${remindersDue}, Selected \${selected}\`);
      }`;

code = code.replace(oldReminder, newReminder);

// Replace OverdueAlerts logic
const oldOverdue = `      if (settings.notifications.overdueAlerts) {
         for (const task of tasks) {
           if (task.status === 'Completed' || task.status === 'Cancelled' || task.status === 'Skipped' || !task.endTime || !task.date) continue;
           
           try {
             const taskEndUTC = fromZonedTime(\`\${task.date}T\${task.endTime}:00\`, tz);
             if (now.getTime() > taskEndUTC.getTime()) {
                const eventId = \`overdue_\${task.id}_\${task.date}_\${task.endTime}\`;
                await sendUserPush(eventId, 'FlowState', \`Công việc đã quá hạn: \${task.title}\`, '/tasks');
             }
           } catch(e) {
           }
         }
      }`;

const newOverdue = `      if (settings.notifications.overdueAlerts) {
         let overdueEvaluated = 0;
         let overdueDue = 0;
         let overdueSent = 0;

         for (const task of tasks) {
           if (task.status === 'Completed' || task.status === 'Cancelled' || task.status === 'Skipped' || !task.endTime || !task.date) continue;
           if (task.date !== localDateStr && task.date !== tomorrowStr) {
               // Only check tasks from today or yesterday to prevent massive historical queries
               const yesterdayStr = formatInTimeZone(new Date(now.getTime() - 86400000), tz, 'yyyy-MM-dd');
               if (task.date !== yesterdayStr) continue;
           }

           overdueEvaluated++;
           
           try {
             const taskEndUTC = fromZonedTime(\`\${task.date}T\${task.endTime}:00\`, tz);
             const diffMs = now.getTime() - taskEndUTC.getTime();
             const diffMins = Math.floor(diffMs / 60000);
             
             // If now is > end time, and less than 24 hours have passed
             if (diffMins >= 0 && diffMins <= 1440) {
                overdueDue++;
                const eventId = \`overdue_\${task.id}_\${task.date}_\${task.endTime}\`;
                const sent = await sendUserPush(eventId, 'FlowState', \`Công việc đã quá hạn: \${task.title}\`, '/tasks');
                if (sent) overdueSent++;
                logs.push(\`Task \${task.id} (\${task.title}): overdue by \${diffMins}m, sent=\${sent}\`);
             }
           } catch(e) {
           }
         }
         logs.push(\`OverdueAlerts: Evaluated \${overdueEvaluated}, Due \${overdueDue}, Sent \${overdueSent}\`);
      }`;

code = code.replace(oldOverdue, newOverdue);

const oldSummary = `      if (settings.notifications.dailySummary) {
         const summaryTime = settings.notifications.dailySummaryTime || '07:00';
         
         if (localTimeStr >= summaryTime) {
            const eventId = \`summary_\${localDateStr}\`;
            const eventDoc = await db.doc(\`users/\${userDoc.id}/notificationEvents/\${eventId}\`).get();
            if (!eventDoc.exists) {
               const todaysTasks = tasks.filter((t: any) => t.date === localDateStr);
               const completed = todaysTasks.filter((t: any) => t.status === 'Completed').length;
               const important = todaysTasks.filter((t: any) => t.priority === 'High' || t.priority === 'Urgent').length;
               const remaining = todaysTasks.length - completed;
               
               await sendUserPush(eventId, 'FlowState', \`Lịch hôm nay: \${todaysTasks.length} công việc • \${important} quan trọng • \${remaining} chưa hoàn thành\`, '/calendar');
            }
         }
      }`;

const newSummary = `      if (settings.notifications.dailySummary) {
         const summaryTime = settings.notifications.dailySummaryTime || '07:00';
         
         let summaryEvaluated = 1;
         let summarySent = 0;
         
         // Only send if we are within 2 hours of the summary time to prevent late-day sends if the cron was completely down
         // but normally it will trigger precisely when localTimeStr >= summaryTime
         
         const [sHour, sMin] = summaryTime.split(':').map(Number);
         const summaryTimeUTC = fromZonedTime(\`\${localDateStr}T\${summaryTime}:00\`, tz);
         
         const diffMins = Math.floor((now.getTime() - summaryTimeUTC.getTime()) / 60000);
         
         if (diffMins >= 0 && diffMins <= 120) {
            const eventId = \`summary_\${localDateStr}_\${summaryTime}\`;
            const sent = await sendUserPush(eventId, 'FlowState', \`Lịch hôm nay: \${tasks.filter((t: any) => t.date === localDateStr).length} công việc\`, '/calendar');
            if (sent) summarySent++;
         } else {
            logs.push(\`Summary skipped: diffMins=\${diffMins} outside window\`);
         }
         logs.push(\`DailySummary: Evaluated \${summaryEvaluated}, Sent \${summarySent}\`);
      }`;

code = code.replace(oldSummary, newSummary);

fs.writeFileSync('api/process-notifications.ts', code);
console.log('Done');
