import re

with open('src/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

def inject_priority(lang, low, medium, high, urgent):
    global content
    pattern = r'("' + lang + r'":\s*\{)'
    payload = f"""
    "priority": {{
      "low": "{low}",
      "medium": "{medium}",
      "high": "{high}",
      "urgent": "{urgent}"
    }},"""
    content = re.sub(pattern, r'\1\n' + payload, content, count=1)

inject_priority("en", "Low", "Medium", "High", "Urgent")
inject_priority("vi", "Thấp", "Trung bình", "Cao", "Khẩn cấp")
inject_priority("zh", "低", "中", "高", "紧急")
inject_priority("ko", "낮음", "보통", "높음", "긴급")

with open('src/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.write(content)
