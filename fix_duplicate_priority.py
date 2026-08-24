import re

with open('src/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern for the priority block I injected
pattern = r'\s*"priority": \{\s*"low": "[^"]*",\s*"medium": "[^"]*",\s*"high": "[^"]*",\s*"urgent": "[^"]*"\s*\},'

# We have 4 languages, so we have 8 blocks total. I want to remove the ones I injected.
# Since the injected ones are identical to the original ones (except maybe the translations), I can just remove the ones at the top of each language.
# The ones at the top are followed by "auth": { ... } since I injected "auth" right after (wait, I injected auth first, then priority, so priority is above auth).
content = re.sub(r'(\s*"priority": \{\s*"low": "[^"]*",\s*"medium": "[^"]*",\s*"high": "[^"]*",\s*"urgent": "[^"]*"\s*\},)(\s*"auth": \{)', r'\2', content)

with open('src/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.write(content)
