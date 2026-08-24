import re

with open('src/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

def inject_sort(lang, earliestTime, furthestDueDate, latestTime, nearestDueDate, newestCreated, oldestCreated):
    global content
    pattern = r'("' + lang + r'":\s*\{)'
    payload = f"""
    "sort": {{
      "earliestTime": "{earliestTime}",
      "furthestDueDate": "{furthestDueDate}",
      "latestTime": "{latestTime}",
      "nearestDueDate": "{nearestDueDate}",
      "newestCreated": "{newestCreated}",
      "oldestCreated": "{oldestCreated}"
    }},"""
    content = re.sub(pattern, r'\1\n' + payload, content, count=1)

inject_sort("en", "Earliest Time", "Furthest Due Date", "Latest Time", "Nearest Due Date", "Newest Created", "Oldest Created")
inject_sort("vi", "Thời gian sớm nhất", "Hạn chót xa nhất", "Thời gian muộn nhất", "Hạn chót gần nhất", "Tạo mới nhất", "Tạo cũ nhất")
inject_sort("zh", "最早时间", "最远截止日期", "最晚时间", "最近截止日期", "最新创建", "最早创建")
inject_sort("ko", "가장 이른 시간", "가장 먼 마감일", "가장 늦은 시간", "가장 가까운 마감일", "최근 생성", "가장 오래된 생성")

with open('src/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.write(content)
