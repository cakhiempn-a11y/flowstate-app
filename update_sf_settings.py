import re

with open('src/components/SpecialFeaturesSettings.tsx', 'r') as f:
    code = f.read()

code = code.replace("Special Features Security", "Private Space Security")
code = code.replace("unlock Special Features", "unlock Private Space")
code = code.replace("disable Special Features protection", "disable Private Space protection")
code = code.replace("Reset your Special Features PIN?", "Reset your Private Space PIN?")

with open('src/components/SpecialFeaturesSettings.tsx', 'w') as f:
    f.write(code)

