import re

with open('src/components/layout/ProtectedRoute.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """              // Ensure Private Space is locked upon hydration to prevent local state leaking
              hydrationData.isSpecialFeaturesUnlocked = false;"""

new_block = """              // Ensure Private Space is locked upon hydration to prevent local state leaking
              hydrationData.isSpecialFeaturesUnlocked = false;
              
              // Ensure timers are reset
              hydrationData.activeTimer = null;"""

content = content.replace(old_block, new_block)

with open('src/components/layout/ProtectedRoute.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched ProtectedRoute.tsx timer")
