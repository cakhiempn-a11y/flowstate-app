import re

with open('src/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

def inject_validation(lang, dueDateBeforeScheduledError, dueDatePastError, scheduleAfterDueError, schedulePastError, startTimePastError):
    global content
    pattern = r'("' + lang + r'":\s*\{.*?)"validation":\s*\{'
    payload = r'\1"validation": {\n      "dueDateBeforeScheduledError": "' + dueDateBeforeScheduledError + '",\n      "dueDatePastError": "' + dueDatePastError + '",\n      "scheduleAfterDueError": "' + scheduleAfterDueError + '",\n      "schedulePastError": "' + schedulePastError + '",\n      "startTimePastError": "' + startTimePastError + '",'
    content = re.sub(pattern, payload, content, flags=re.DOTALL)

inject_validation("en", "Due date cannot be before scheduled date", "Due date cannot be in the past", "Cannot schedule after due date", "Cannot schedule in the past", "Start time cannot be in the past")
inject_validation("vi", "Hạn chót không thể trước ngày xếp lịch", "Hạn chót không thể trong quá khứ", "Không thể xếp lịch sau hạn chót", "Không thể xếp lịch trong quá khứ", "Thời gian bắt đầu không thể trong quá khứ")
inject_validation("zh", "截止日期不能在预定日期之前", "截止日期不能在过去", "无法安排在截止日期之后", "无法安排在过去", "开始时间不能在过去")
inject_validation("ko", "마감일은 예정일 이전일 수 없습니다", "마감일은 과거일 수 없습니다", "마감일 이후로 일정을 잡을 수 없습니다", "과거로 일정을 잡을 수 없습니다", "시작 시간은 과거일 수 없습니다")

with open('src/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.write(content)
