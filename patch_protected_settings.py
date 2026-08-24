import re

with open('src/components/layout/ProtectedRoute.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { useStore, defaultCategories } from '../../store/useStore';", "import { useStore, defaultCategories, defaultSettings } from '../../store/useStore';")

old_block = """              if (data.profile && data.profile.settings) {
                hydrationData.settings = data.profile.settings;
              }
              if (data.profile && data.profile.language) {
                hydrationData.language = data.profile.language;
              }"""

new_block = """              if (data.profile && data.profile.settings) {
                hydrationData.settings = data.profile.settings;
              } else {
                hydrationData.settings = defaultSettings;
              }
              if (data.profile && data.profile.language) {
                hydrationData.language = data.profile.language;
              } else {
                hydrationData.language = 'en';
              }"""

content = content.replace(old_block, new_block)

with open('src/components/layout/ProtectedRoute.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched ProtectedRoute.tsx again")
