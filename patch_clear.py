import re

with open('src/store/useStore.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "clearStoreForLogout: () => set({ isSpecialFeaturesUnlocked: false,  profile: {},",
    "clearStoreForLogout: () => set({ isSpecialFeaturesUnlocked: false,  profile: {}, settings: defaultSettings, language: 'en',"
)

with open('src/store/useStore.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched useStore.ts clearStoreForLogout")
