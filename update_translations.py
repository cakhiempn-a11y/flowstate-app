import re

with open('src/i18n/translations.ts', 'r') as f:
    code = f.read()

def replace_translations(lang, translations_dict):
    global code
    # Find the specialFeatures block for this language
    # Example: "en": {\n    "specialFeatures": { ... }
    
    # We'll just use a regex to replace the entire specialFeatures block for each language
    pattern = r'("' + lang + r'":\s*\{.*?)"specialFeatures":\s*\{(.*?)\}(,?\s*"nav":)'
    
    def repl(m):
        new_sf = '    "specialFeatures": {\n'
        for k, v in translations_dict.items():
            new_sf += f'      "{k}": "{v}",\n'
        new_sf = new_sf.rstrip(',\n') + '\n    }'
        return m.group(1) + new_sf + m.group(3)
        
    code = re.sub(pattern, repl, code, flags=re.DOTALL)
    
    # Update nav.specialFeatures
    nav_pattern = r'("' + lang + r'":\s*\{.*?)"nav":\s*\{(.*?)"specialFeatures":\s*"([^"]+)"'
    def nav_repl(m):
        return m.group(1) + '"nav": {' + m.group(2) + '"specialFeatures": "' + translations_dict["title"] + '"'
    code = re.sub(nav_pattern, nav_repl, code, flags=re.DOTALL)

en = {
  "title": "Private Space",
  "subtitle": "Private Information",
  "privateInfo": "Private Information",
  "setUpPin": "Set up PIN",
  "enterPin": "Enter PIN",
  "confirmPin": "Confirm PIN",
  "currentPin": "Current PIN",
  "newPin": "New PIN",
  "confirmNewPin": "Confirm New PIN",
  "changePin": "Change PIN",
  "disablePin": "Disable PIN",
  "pinRequired": "PIN is required to access Private Space",
  "pinMismatch": "PINs do not match",
  "pinLength": "PIN must be exactly 6 digits",
  "pinIncorrect": "Incorrect PIN",
  "tooManyAttempts": "Too many failed attempts",
  "tryAgainIn": "Try again in",
  "lock": "Lock",
  "menstrualCycle": "Menstrual Cycle",
  "addPeriod": "Add Period",
  "periodStartDate": "Period Start Date",
  "periodEndDate": "Period End Date",
  "estimated": "Estimated",
  "cycleLength": "Cycle Length",
  "estimatedNextPeriod": "Estimated Next Period",
  "cycleHistory": "Cycle History",
  "noData": "No data",
  "days": "days",
  "dayCycle": "Day Cycle",
  "invalidDates": "End date cannot be before start date",
  "forgotPin": "Forgot PIN?",
  "edit": "Edit",
  "delete": "Delete",
  "deleteConfirm": "Are you sure you want to delete this period record?",
  "estimatedOvulation": "Estimated Ovulation Date",
  "estimatedFertileWindow": "Estimated Fertile Window",
  "notEnoughData": "Not enough data to estimate",
  "partnerReminders": "Partner Reminders",
  "allowSharing": "Allow cycle information sharing with partner",
  "sharingWarning": "You can create reminders for your partner, but your cycle data will not be shared unless you explicitly enable it.",
  "customMessage": "Custom Message",
  "customMessagePlaceholder": "e.g. Please bring some chocolate!",
  "sharePermissions": "Share Permissions",
  "shareNextPeriod": "Share next expected period",
  "shareCurrentStatus": "Share current period status",
  "shareOvulation": "Share estimated ovulation date",
  "shareFertileWindow": "Share estimated fertile window",
  "cancel": "Cancel",
  "save": "Save"
}

vi = {
  "title": "Không gian riêng tư",
  "subtitle": "Thông tin cá nhân riêng tư",
  "privateInfo": "Thông tin riêng tư",
  "setUpPin": "Thiết lập mã PIN",
  "enterPin": "Nhập mã PIN",
  "confirmPin": "Xác nhận mã PIN",
  "currentPin": "Mã PIN hiện tại",
  "newPin": "Mã PIN mới",
  "confirmNewPin": "Xác nhận mã PIN mới",
  "changePin": "Đổi mã PIN",
  "disablePin": "Tắt mã PIN",
  "pinRequired": "Cần có mã PIN để truy cập Không gian riêng tư",
  "pinMismatch": "Mã PIN không khớp",
  "pinLength": "Mã PIN phải có đúng 6 chữ số",
  "pinIncorrect": "Mã PIN không chính xác",
  "tooManyAttempts": "Thử sai quá nhiều lần",
  "tryAgainIn": "Thử lại sau",
  "lock": "Khóa lại",
  "menstrualCycle": "Chu kỳ kinh nguyệt",
  "addPeriod": "+ Thêm kỳ kinh",
  "periodStartDate": "Ngày bắt đầu",
  "periodEndDate": "Ngày kết thúc",
  "estimated": "Ước tính",
  "cycleLength": "Độ dài chu kỳ",
  "estimatedNextPeriod": "Dự kiến kỳ tiếp theo",
  "cycleHistory": "Lịch sử chu kỳ",
  "noData": "Chưa có dữ liệu chu kỳ",
  "days": "ngày",
  "dayCycle": "Ngày chu kỳ",
  "invalidDates": "Ngày kết thúc không thể trước ngày bắt đầu",
  "forgotPin": "Quên mã PIN?",
  "edit": "Sửa",
  "delete": "Xóa",
  "deleteConfirm": "Bạn có chắc muốn xóa kỳ kinh này?",
  "estimatedOvulation": "Ngày rụng trứng dự kiến",
  "estimatedFertileWindow": "Cửa sổ thụ thai ước tính",
  "notEnoughData": "Chưa đủ dữ liệu để ước tính",
  "partnerReminders": "Nhắc nhở cho bạn đời",
  "allowSharing": "Cho phép chia sẻ thông tin chu kỳ với bạn đời",
  "sharingWarning": "Bạn có thể tạo lời nhắc cho bạn đời, nhưng dữ liệu chu kỳ của bạn sẽ không được chia sẻ nếu bạn chưa chủ động bật.",
  "customMessage": "Tin nhắn tùy chỉnh",
  "customMessagePlaceholder": "vd: Nhớ mua chút socola nhé!",
  "sharePermissions": "Quyền chia sẻ",
  "shareNextPeriod": "Chia sẻ ngày dự kiến kỳ tiếp theo",
  "shareCurrentStatus": "Chia sẻ trạng thái kỳ kinh hiện tại",
  "shareOvulation": "Chia sẻ ngày rụng trứng dự kiến",
  "shareFertileWindow": "Chia sẻ cửa sổ thụ thai ước tính",
  "cancel": "Hủy",
  "save": "Lưu"
}

zh = {
  "title": "隐私空间",
  "subtitle": "私人信息",
  "privateInfo": "私人信息",
  "setUpPin": "设置 PIN 码",
  "enterPin": "输入 PIN 码",
  "confirmPin": "确认 PIN 码",
  "currentPin": "当前 PIN 码",
  "newPin": "新 PIN 码",
  "confirmNewPin": "确认新 PIN 码",
  "changePin": "更改 PIN 码",
  "disablePin": "禁用 PIN 码",
  "pinRequired": "需要 PIN 码才能访问隐私空间",
  "pinMismatch": "PIN 码不匹配",
  "pinLength": "PIN 码必须正好是 6 位数字",
  "pinIncorrect": "PIN 码不正确",
  "tooManyAttempts": "失败尝试次数过多",
  "tryAgainIn": "稍后重试",
  "lock": "锁定",
  "menstrualCycle": "月经周期",
  "addPeriod": "添加经期",
  "periodStartDate": "经期开始日期",
  "periodEndDate": "经期结束日期",
  "estimated": "估计",
  "cycleLength": "周期长度",
  "estimatedNextPeriod": "预计下一次经期",
  "cycleHistory": "周期历史",
  "noData": "还没有周期数据",
  "days": "天",
  "dayCycle": "天周期",
  "invalidDates": "结束日期不能早于开始日期",
  "forgotPin": "忘记 PIN 码？",
  "edit": "编辑",
  "delete": "删除",
  "deleteConfirm": "您确定要删除此经期记录吗？",
  "estimatedOvulation": "预计排卵日",
  "estimatedFertileWindow": "预计受孕期",
  "notEnoughData": "数据不足，无法估计",
  "partnerReminders": "伴侣提醒",
  "allowSharing": "允许与伴侣共享周期信息",
  "sharingWarning": "您可以为伴侣创建提醒，但除非您明确启用，否则您的周期数据不会被共享。",
  "customMessage": "自定义消息",
  "customMessagePlaceholder": "例如：请带点巧克力！",
  "sharePermissions": "共享权限",
  "shareNextPeriod": "共享预计下一次经期",
  "shareCurrentStatus": "共享当前经期状态",
  "shareOvulation": "共享预计排卵日",
  "shareFertileWindow": "共享预计受孕期",
  "cancel": "取消",
  "save": "保存"
}

ko = {
  "title": "프라이빗 공간",
  "subtitle": "개인 정보",
  "privateInfo": "개인 정보",
  "setUpPin": "PIN 설정",
  "enterPin": "PIN 입력",
  "confirmPin": "PIN 확인",
  "currentPin": "현재 PIN",
  "newPin": "새 PIN",
  "confirmNewPin": "새 PIN 확인",
  "changePin": "PIN 변경",
  "disablePin": "PIN 비활성화",
  "pinRequired": "프라이빗 공간에 접근하려면 PIN이 필요합니다",
  "pinMismatch": "PIN이 일치하지 않습니다",
  "pinLength": "PIN은 정확히 6자리 숫자여야 합니다",
  "pinIncorrect": "올바르지 않은 PIN입니다",
  "tooManyAttempts": "실패한 시도가 너무 많습니다",
  "tryAgainIn": "다시 시도",
  "lock": "잠금",
  "menstrualCycle": "월경 주기",
  "addPeriod": "기간 추가",
  "periodStartDate": "기간 시작일",
  "periodEndDate": "기간 종료일",
  "estimated": "예상",
  "cycleLength": "주기 길이",
  "estimatedNextPeriod": "예상 다음 기간",
  "cycleHistory": "주기 기록",
  "noData": "아직 주기 데이터 없음",
  "days": "일",
  "dayCycle": "일 주기",
  "invalidDates": "종료일은 시작일보다 이전일 수 없습니다",
  "forgotPin": "PIN을 잊으셨나요?",
  "edit": "편집",
  "delete": "삭제",
  "deleteConfirm": "이 기간 기록을 삭제하시겠습니까?",
  "estimatedOvulation": "예상 배란일",
  "estimatedFertileWindow": "예상 가임기",
  "notEnoughData": "예상할 데이터가 충분하지 않습니다",
  "partnerReminders": "파트너 알림",
  "allowSharing": "파트너와 주기 정보 공유 허용",
  "sharingWarning": "파트너를 위한 알림을 만들 수 있지만, 명시적으로 활성화하지 않는 한 주기 데이터는 공유되지 않습니다.",
  "customMessage": "사용자 지정 메시지",
  "customMessagePlaceholder": "예: 초콜릿 좀 사다 주세요!",
  "sharePermissions": "공유 권한",
  "shareNextPeriod": "예상 다음 기간 공유",
  "shareCurrentStatus": "현재 기간 상태 공유",
  "shareOvulation": "예상 배란일 공유",
  "shareFertileWindow": "예상 가임기 공유",
  "cancel": "취소",
  "save": "저장"
}

replace_translations("en", en)
replace_translations("vi", vi)
replace_translations("zh", zh)
replace_translations("ko", ko)

with open('src/i18n/translations.ts', 'w') as f:
    f.write(code)

