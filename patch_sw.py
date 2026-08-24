with open('public/sw.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('flowstate-cache-v2', 'flowstate-cache-v3')

with open('public/sw.js', 'w', encoding='utf-8') as f:
    f.write(content)
