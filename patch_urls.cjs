const fs = require('fs');
let code = fs.readFileSync('api/process-notifications.ts', 'utf8');

code = code.replace(`await sendUserPush(eventId, 'FlowState', \`Công việc sắp bắt đầu: \${task.title}\`, '/');`,
                    `await sendUserPush(eventId, 'FlowState', \`Công việc sắp bắt đầu: \${task.title}\`, '/tasks');`);

code = code.replace(`await sendUserPush(eventId, 'FlowState', \`Công việc đã quá hạn: \${task.title}\`, '/');`,
                    `await sendUserPush(eventId, 'FlowState', \`Công việc đã quá hạn: \${task.title}\`, '/tasks');`);

code = code.replace(`await sendUserPush(eventId, 'FlowState', \`Lịch hôm nay: \${todaysTasks.length} công việc • \${important} quan trọng • \${remaining} chưa hoàn thành\`, '/');`,
                    `await sendUserPush(eventId, 'FlowState', \`Lịch hôm nay: \${todaysTasks.length} công việc • \${important} quan trọng • \${remaining} chưa hoàn thành\`, '/calendar');`);

fs.writeFileSync('api/process-notifications.ts', code);
