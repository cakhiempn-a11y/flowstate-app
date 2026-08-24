import re

with open('src/store/useStore.ts', 'r') as f:
    code = f.read()

# I corrupted:
# activeTimer: null,\n  isSpecialFeaturesUnlocked: boolean;\n  setSpecialFeaturesUnlocked: (unlocked: boolean) => void;
# which appeared multiple times.

code = code.replace("activeTimer: null,\n  isSpecialFeaturesUnlocked: boolean;\n  setSpecialFeaturesUnlocked: (unlocked: boolean) => void;", "activeTimer: null,")
code = code.replace("language: 'en',\n  isSpecialFeaturesUnlocked: false,", "language: 'en',")
code = code.replace("setSpecialFeaturesUnlocked: (unlocked) => set({ isSpecialFeaturesUnlocked: unlocked }),\n      clearStoreForLogout: () => set({ isSpecialFeaturesUnlocked: false, ", "clearStoreForLogout: () => set({")

with open('src/store/useStore.ts', 'w') as f:
    f.write(code)

