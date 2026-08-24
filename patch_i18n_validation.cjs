const fs = require('fs');
let code = fs.readFileSync('src/i18n/translations.ts', 'utf8');

// English
code = code.replace(
  '"scheduleConflict": "Schedule Conflict",',
  '"scheduleConflict": "Schedule Conflict",\n      "dueDatePastError": "Due date cannot be before today.",\n      "schedulePastError": "Scheduled date must be today or later.",\n      "scheduleAfterDueError": "Scheduled date must be between today and the due date.",\n      "startTimePastError": "Start time must be now or later.",\n      "dueDateBeforeScheduledError": "The new due date cannot be earlier than the current scheduled date. Reschedule the task first.",'
);

// Vietnamese
code = code.replace(
  '"scheduleConflict": "Trùng lịch",',
  '"scheduleConflict": "Trùng lịch",\n      "dueDatePastError": "Ngày đến hạn không thể trước ngày hôm nay.",\n      "schedulePastError": "Ngày xếp lịch phải từ hôm nay trở đi.",\n      "scheduleAfterDueError": "Ngày xếp lịch phải từ hôm nay đến ngày đến hạn.",\n      "startTimePastError": "Thời gian bắt đầu phải từ thời điểm hiện tại trở đi.",\n      "dueDateBeforeScheduledError": "Ngày đến hạn mới không thể trước ngày xếp lịch hiện tại. Vui lòng xếp lịch lại trước.",'
);

// Chinese
code = code.replace(
  '"scheduleConflict": "日程冲突",',
  '"scheduleConflict": "日程冲突",\n      "dueDatePastError": "截止日期不能在今天之前。",\n      "schedulePastError": "计划日期必须是今天或更晚。",\n      "scheduleAfterDueError": "计划日期必须在今天和截止日期之间。",\n      "startTimePastError": "开始时间必须是现在或更晚。",\n      "dueDateBeforeScheduledError": "新的截止日期不能早于当前的计划日期。请先重新安排任务日程。",'
);

// Korean
code = code.replace(
  '"scheduleConflict": "일정 충돌",',
  '"scheduleConflict": "일정 충돌",\n      "dueDatePastError": "기한은 오늘 이전일 수 없습니다.",\n      "schedulePastError": "예약 날짜는 오늘 이후여야 합니다.",\n      "scheduleAfterDueError": "예약 날짜는 오늘과 기한 사이여야 합니다.",\n      "startTimePastError": "시작 시간은 현재 또는 그 이후여야 합니다.",\n      "dueDateBeforeScheduledError": "새 기한은 현재 예약된 날짜보다 이전일 수 없습니다. 먼저 작업을 다시 예약하세요.",'
);

fs.writeFileSync('src/i18n/translations.ts', code);
console.log('Patched translations');
