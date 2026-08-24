import re

with open('src/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

def inject(lang, payload):
    global content
    pattern = r'("' + lang + r'":\s*\{)'
    # Be careful not to replace multiple times if there are multiple matches
    content = re.sub(pattern, r'\1\n' + payload, content, count=1)

en_payload = """
    "login": {
      "welcomeBack": "Welcome Back",
      "signInDesc": "Sign in to continue",
      "email": "Email",
      "password": "Password",
      "forgotPassword": "Forgot password?",
      "signIn": "Sign In",
      "orContinueWith": "Or continue with",
      "google": "Google",
      "dontHaveAccount": "Don't have an account?",
      "signUpBtn": "Sign Up",
      "createAccount": "Create Account",
      "signUpDesc": "Sign up to get started",
      "alreadyHaveAccount": "Already have an account?",
      "displayName": "Display Name"
    },
    "profile": {
      "profileSettings": "Profile Settings",
      "occupation": "Occupation",
      "birthYear": "Birth Year",
      "gender": "Gender",
      "male": "Male",
      "female": "Female",
      "nonBinary": "Non-binary",
      "other": "Other",
      "preferNotToSay": "Prefer not to say",
      "saveChanges": "Save Changes",
      "savedSuccessfully": "Saved Successfully",
      "saveFailed": "Operation failed",
      "invalidFileType": "Invalid File Type",
      "fileTooLarge": "File Too Large (Max 5MB)",
      "uploadFailed": "Upload Failed",
      "changePhoto": "Change"
    },
    "languages": {
      "en": "English",
      "vi": "Tiếng Việt",
      "zh": "中文",
      "ko": "한국어"
    },
"""

vi_payload = """
    "login": {
      "welcomeBack": "Chào mừng trở lại",
      "signInDesc": "Đăng nhập để tiếp tục",
      "email": "Email",
      "password": "Mật khẩu",
      "forgotPassword": "Quên mật khẩu?",
      "signIn": "Đăng nhập",
      "orContinueWith": "Hoặc tiếp tục với",
      "google": "Google",
      "dontHaveAccount": "Chưa có tài khoản?",
      "signUpBtn": "Đăng ký",
      "createAccount": "Tạo tài khoản",
      "signUpDesc": "Đăng ký để bắt đầu",
      "alreadyHaveAccount": "Đã có tài khoản?",
      "displayName": "Tên hiển thị"
    },
    "profile": {
      "profileSettings": "Cài đặt Hồ sơ",
      "occupation": "Nghề nghiệp",
      "birthYear": "Năm sinh",
      "gender": "Giới tính",
      "male": "Nam",
      "female": "Nữ",
      "nonBinary": "Khác",
      "other": "Khác",
      "preferNotToSay": "Không muốn tiết lộ",
      "saveChanges": "Lưu thay đổi",
      "savedSuccessfully": "Lưu thành công",
      "saveFailed": "Lưu thất bại",
      "invalidFileType": "Định dạng không hợp lệ",
      "fileTooLarge": "File quá lớn (Tối đa 5MB)",
      "uploadFailed": "Tải lên thất bại",
      "changePhoto": "Thay đổi"
    },
    "languages": {
      "en": "English",
      "vi": "Tiếng Việt",
      "zh": "中文",
      "ko": "한국어"
    },
"""

zh_payload = """
    "login": {
      "welcomeBack": "欢迎回来",
      "signInDesc": "登录以继续",
      "email": "邮箱",
      "password": "密码",
      "forgotPassword": "忘记密码？",
      "signIn": "登录",
      "orContinueWith": "或通过以下方式继续",
      "google": "Google",
      "dontHaveAccount": "没有账户？",
      "signUpBtn": "注册",
      "createAccount": "创建账户",
      "signUpDesc": "注册以开始",
      "alreadyHaveAccount": "已有账户？",
      "displayName": "显示名称"
    },
    "profile": {
      "profileSettings": "个人资料设置",
      "occupation": "职业",
      "birthYear": "出生年份",
      "gender": "性别",
      "male": "男",
      "female": "女",
      "nonBinary": "非二元",
      "other": "其他",
      "preferNotToSay": "不愿透露",
      "saveChanges": "保存更改",
      "savedSuccessfully": "保存成功",
      "saveFailed": "操作失败",
      "invalidFileType": "无效的文件类型",
      "fileTooLarge": "文件过大（最大 5MB）",
      "uploadFailed": "上传失败",
      "changePhoto": "更改"
    },
    "languages": {
      "en": "English",
      "vi": "Tiếng Việt",
      "zh": "中文",
      "ko": "한국어"
    },
"""

ko_payload = """
    "login": {
      "welcomeBack": "환영합니다",
      "signInDesc": "계속하려면 로그인하세요",
      "email": "이메일",
      "password": "비밀번호",
      "forgotPassword": "비밀번호를 잊으셨나요?",
      "signIn": "로그인",
      "orContinueWith": "또는 다음으로 계속",
      "google": "Google",
      "dontHaveAccount": "계정이 없으신가요?",
      "signUpBtn": "가입하기",
      "createAccount": "계정 만들기",
      "signUpDesc": "가입하여 시작하세요",
      "alreadyHaveAccount": "이미 계정이 있으신가요?",
      "displayName": "표시 이름"
    },
    "profile": {
      "profileSettings": "프로필 설정",
      "occupation": "직업",
      "birthYear": "출생 연도",
      "gender": "성별",
      "male": "남성",
      "female": "여성",
      "nonBinary": "논바이너리",
      "other": "기타",
      "preferNotToSay": "공개 안 함",
      "saveChanges": "변경 사항 저장",
      "savedSuccessfully": "성공적으로 저장되었습니다",
      "saveFailed": "작업 실패",
      "invalidFileType": "잘못된 파일 형식",
      "fileTooLarge": "파일이 너무 큽니다 (최대 5MB)",
      "uploadFailed": "업로드 실패",
      "changePhoto": "변경"
    },
    "languages": {
      "en": "English",
      "vi": "Tiếng Việt",
      "zh": "中文",
      "ko": "한국어"
    },
"""

inject("en", en_payload)
inject("vi", vi_payload)
inject("zh", zh_payload)
inject("ko", ko_payload)

# Now inject missing specialFeatures keys
def inject_sf(lang, pinIsSet, pinNotSet, forgotPin, pinLengthError, pinMatchError):
    global content
    pattern = r'("' + lang + r'":\s*\{.*?)"specialFeatures":\s*\{'
    payload = r'\1"specialFeatures": {\n      "pinIsSet": "' + pinIsSet + '",\n      "pinNotSet": "' + pinNotSet + '",\n      "forgotPin": "' + forgotPin + '",\n      "pinLengthError": "' + pinLengthError + '",\n      "pinMatchError": "' + pinMatchError + '",'
    content = re.sub(pattern, payload, content, flags=re.DOTALL)

inject_sf("en", "PIN is set", "PIN not set", "Forgot PIN?", "PIN must contain 4-6 digits.", "The PINs do not match.")
inject_sf("vi", "Đã đặt mã PIN", "Chưa đặt mã PIN", "Quên mã PIN?", "Mã PIN phải chứa từ 4-6 chữ số.", "Mã PIN không khớp.")
inject_sf("zh", "已设置 PIN 码", "未设置 PIN 码", "忘记 PIN 码？", "PIN 码必须包含 4-6 位数字。", "PIN 码不匹配。")
inject_sf("ko", "PIN 설정됨", "PIN 설정 안 됨", "PIN을 잊으셨나요?", "PIN은 4-6자리 숫자여야 합니다.", "PIN이 일치하지 않습니다.")

with open('src/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.write(content)

