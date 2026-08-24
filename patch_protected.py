import re

with open('src/components/layout/ProtectedRoute.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { useStore } from '../../store/useStore';", "import { useStore, defaultCategories } from '../../store/useStore';")

old_block = """              // Always hydrate store with whatever we got from Firebase
              const hydrationData: any = {
                tasks: data.tasks || [],
                recurringTasks: data.recurringTasks || [],
                timeEntries: data.timeEntries || []
              };
              if (data.categories && data.categories.length > 0) {
                hydrationData.categories = data.categories;
              }
              
              if (data.profile) {
                if (data.profile.settings) hydrationData.settings = data.profile.settings;
                if (data.profile.language) hydrationData.language = data.profile.language;
                hydrationData.profile = { avatarUrl: data.profile.avatarUrl, avatarType: data.profile.avatarType, specialFeaturesPinHash: data.profile.specialFeaturesPinHash, specialFeaturesPinEnabled: data.profile.specialFeaturesPinEnabled };
              }"""

new_block = """              // Always hydrate store with whatever we got from Firebase, falling back to defaults to ensure complete isolation
              const hydrationData: any = {
                tasks: data.tasks || [],
                recurringTasks: data.recurringTasks || [],
                timeEntries: data.timeEntries || [],
                categories: (data.categories && data.categories.length > 0) ? data.categories : defaultCategories,
                profile: data.profile ? { 
                  avatarUrl: data.profile.avatarUrl || '', 
                  avatarType: data.profile.avatarType || '', 
                  specialFeaturesPinHash: data.profile.specialFeaturesPinHash || '', 
                  specialFeaturesPinEnabled: !!data.profile.specialFeaturesPinEnabled 
                } : {},
              };
              
              if (data.profile && data.profile.settings) {
                hydrationData.settings = data.profile.settings;
              }
              if (data.profile && data.profile.language) {
                hydrationData.language = data.profile.language;
              }"""

content = content.replace(old_block, new_block)

with open('src/components/layout/ProtectedRoute.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched ProtectedRoute.tsx")
