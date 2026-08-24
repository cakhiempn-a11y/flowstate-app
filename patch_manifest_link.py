import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'href="/manifest\.webmanifest(\?v=\d+)?"', 'href="/manifest.webmanifest?v=2"', content)
content = re.sub(r'navigator\.serviceWorker\.register\(\'/sw\.js(\?v=\d+)?\'\)', "navigator.serviceWorker.register('/sw.js?v=2')", content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
