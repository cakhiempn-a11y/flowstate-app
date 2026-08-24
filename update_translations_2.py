import re

with open('src/i18n/translations.ts', 'r') as f:
    code = f.read()

# Add securityTitle and securityDesc
def inject_translation(lang, title, desc):
    global code
    pattern = r'("' + lang + r'":\s*\{.*?)"specialFeatures":\s*\{'
    replacement = r'\1"specialFeatures": {\n      "securityTitle": "' + title + '",\n      "securityDesc": "' + desc + '",'
    code = re.sub(pattern, replacement, code, flags=re.DOTALL)

inject_translation("en", "Private Space Security", "This PIN is used only to unlock Private Space and is separate from your login password.")
inject_translation("vi", "Bảo mật Không gian riêng tư", "Mã PIN này chỉ được sử dụng để mở khóa Không gian riêng tư và hoàn toàn tách biệt với mật khẩu đăng nhập của bạn.")
inject_translation("zh", "隐私空间安全", "此 PIN 码仅用于解锁隐私空间，与您的登录密码分开。")
inject_translation("ko", "프라이빗 공간 보안", "이 PIN은 프라이빗 공간을 잠금 해제하는 데만 사용되며 로그인 비밀번호와 별개입니다.")

with open('src/i18n/translations.ts', 'w') as f:
    f.write(code)

