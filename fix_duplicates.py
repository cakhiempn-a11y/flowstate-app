import re

with open('src/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# I want to remove the "forgotPin" line that is immediately followed by "pinLengthError"
content = re.sub(r'\s*"forgotPin":\s*"[^"]*",\n(\s*"pinLengthError")', r'\n\1', content)

with open('src/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.write(content)
