const fs = require('fs');
let code = fs.readFileSync('src/pages/DailySchedule.tsx', 'utf8');
code = code.replace("isOpen={!!selectedTask}", "isOpen={isModalOpen}");
fs.writeFileSync('src/pages/DailySchedule.tsx', code);
