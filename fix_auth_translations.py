import re

with open('src/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

def inject_auth(lang, invalidEmail, userNotFound, incorrectPassword, emailAlreadyInUse, passwordTooShort, operationNotAllowed, tooManyRequests, networkError, unableToSignUp, unableToSignIn, googleSignInFailed, popupBlocked):
    global content
    pattern = r'("' + lang + r'":\s*\{)'
    payload = f"""
    "auth": {{
      "invalidEmail": "{invalidEmail}",
      "userNotFound": "{userNotFound}",
      "incorrectPassword": "{incorrectPassword}",
      "emailAlreadyInUse": "{emailAlreadyInUse}",
      "passwordTooShort": "{passwordTooShort}",
      "operationNotAllowed": "{operationNotAllowed}",
      "tooManyRequests": "{tooManyRequests}",
      "networkError": "{networkError}",
      "unableToSignUp": "{unableToSignUp}",
      "unableToSignIn": "{unableToSignIn}",
      "googleSignInFailed": "{googleSignInFailed}",
      "popupBlocked": "{popupBlocked}"
    }},"""
    content = re.sub(pattern, r'\1\n' + payload, content, count=1)

inject_auth("en", "Invalid email address.", "User not found or invalid credentials.", "Incorrect password.", "Email already in use.", "Password is too weak.", "Email/Password accounts are not enabled.", "Too many requests. Please try again later.", "Network error. Please check your connection.", "Unable to sign up.", "Unable to sign in.", "Google sign-in failed.", "Popup blocked by browser.")
inject_auth("vi", "Địa chỉ email không hợp lệ.", "Không tìm thấy người dùng hoặc thông tin đăng nhập không hợp lệ.", "Mật khẩu không chính xác.", "Email đã được sử dụng.", "Mật khẩu quá yếu.", "Đăng nhập bằng Email/Mật khẩu chưa được bật.", "Quá nhiều yêu cầu. Vui lòng thử lại sau.", "Lỗi mạng. Vui lòng kiểm tra kết nối.", "Không thể đăng ký.", "Không thể đăng nhập.", "Đăng nhập Google thất bại.", "Cửa sổ bật lên bị trình duyệt chặn.")
inject_auth("zh", "无效的电子邮件地址。", "找不到用户或凭据无效。", "密码不正确。", "电子邮件已被使用。", "密码太弱。", "未启用电子邮件/密码账户。", "请求过多。请稍后再试。", "网络错误。请检查您的连接。", "无法注册。", "无法登录。", "Google 登录失败。", "弹出窗口被浏览器拦截。")
inject_auth("ko", "유효하지 않은 이메일 주소입니다.", "사용자를 찾을 수 없거나 잘못된 자격 증명입니다.", "올바르지 않은 비밀번호입니다.", "이미 사용 중인 이메일입니다.", "비밀번호가 너무 약합니다.", "이메일/비밀번호 계정이 활성화되지 않았습니다.", "요청이 너무 많습니다. 나중에 다시 시도해 주세요.", "네트워크 오류입니다. 연결을 확인해 주세요.", "가입할 수 없습니다.", "로그인할 수 없습니다.", "Google 로그인 실패.", "브라우저에서 팝업이 차단되었습니다.")

with open('src/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.write(content)
