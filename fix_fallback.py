import re

with open('src/i18n/useTranslation.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_fallback = "let res = typeof value === 'string' ? value : key;"
new_fallback = "let res = typeof value === 'string' ? value : (keys[keys.length - 1] || key).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());\n    if (typeof value !== 'string') console.warn(`Missing translation for key: ${key}`);"

content = content.replace(old_fallback, new_fallback)

with open('src/i18n/useTranslation.ts', 'w', encoding='utf-8') as f:
    f.write(content)
