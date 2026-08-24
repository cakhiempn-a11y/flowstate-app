import re

with open('public/manifest.webmanifest', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'/icons/icon-192\.png(\?v=\d+)?', '/icons/icon-192.png?v=2', content)
content = re.sub(r'/icons/icon-512\.png(\?v=\d+)?', '/icons/icon-512.png?v=2', content)

with open('public/manifest.webmanifest', 'w', encoding='utf-8') as f:
    f.write(content)
