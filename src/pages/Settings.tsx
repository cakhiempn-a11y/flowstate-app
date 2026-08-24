import React, { useState } from 'react';
import { Card, Select } from '../components/ui';
import { useStore } from '../store/useStore';
import { AccountSettings } from './AccountSettings';
import { DataManagement } from '../components/DataManagement';
import { UserCircle } from 'lucide-react';

import { useBlocker } from 'react-router-dom';
import { useTasks } from '../store/useTasks';
import { useTranslation } from '../i18n/useTranslation';
import { TimeInput } from '../components/TimeInput';
import { DynamicIcon } from '../components/DynamicIcon';
import { Sparkles,  Settings as SettingsIcon, Calendar, CheckSquare, Tags, Bell, BarChart2, Database, Globe, Moon, Sun, Monitor, Download, Upload, Trash2, Plus, Edit2, X, AlertCircle, Heart } from 'lucide-react';
import { Category, AppSettings } from '../types';
import { defaultSettings } from '../store/useStore';

function mergeSettings(defaultSet: any, savedSet: any): any {
  if (!savedSet) return defaultSet;
  return {
    ...defaultSet,
    ...savedSet,
    taskDefaults: { ...defaultSet.taskDefaults, ...(savedSet.taskDefaults || {}) },
    notifications: { ...defaultSet.notifications, ...(savedSet.notifications || {}) },
    analytics: { ...defaultSet.analytics, ...(savedSet.analytics || {}) },
  };
}

export function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('account');
  
  

  const globalLanguage = useStore(state => state.language);
  const globalSetLanguage = useStore(state => state.setLanguage);
  const globalSettings = useStore(state => state.settings);
  const globalUpdateSettings = useStore(state => state.updateSettings);
  
  const safeGlobalSettings = React.useMemo(() => mergeSettings(defaultSettings, globalSettings), [globalSettings]);
  
  const [draftLanguage, setDraftLanguage] = useState(globalLanguage);
  const [draftSettings, setDraftSettings] = useState(safeGlobalSettings);

  // Keep draft in sync if global changes outside
  React.useEffect(() => {
    setDraftLanguage(globalLanguage);
    setDraftSettings(safeGlobalSettings);
  }, [globalLanguage, safeGlobalSettings]);


  const hasChanges = draftLanguage !== globalLanguage || JSON.stringify(draftSettings) !== JSON.stringify(safeGlobalSettings);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasChanges && currentLocation.pathname !== nextLocation.pathname
  );

  React.useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm(t('settings.unsavedChanges') || 'You have unsaved changes. Leave anyway?')) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, t]);

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);


  const updateSettings = (updates: any) => {
    setDraftSettings(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    if (draftLanguage !== globalLanguage) {
      globalSetLanguage(draftLanguage);
    }
    // We overwrite completely via updateSettings by doing full replacement. 
    // Wait, globalUpdateSettings merges, so passing the full draftSettings is safe.
    globalUpdateSettings(draftSettings);
  };

  const handleDiscard = () => {
    setDraftLanguage(globalLanguage);
    setDraftSettings(safeGlobalSettings);
  };
  
  const tabs = [
    { id: 'account', label: t('settings.account') || 'Account', icon: UserCircle },
    { id: 'general', label: t('settings.general') || 'General', icon: Globe },
    { id: 'schedule', label: t('settings.schedule') || 'Schedule', icon: Calendar },
    { id: 'tasks', label: t('settings.tasks') || 'Tasks', icon: CheckSquare },
    { id: 'categories', label: t('settings.categories') || 'Categories', icon: Tags },
    { id: 'notifications', label: t('settings.notifications') || 'Notifications', icon: Bell },
    { id: 'data', label: t('settings.data') || 'Data', icon: Database },
  ];

  return (
    <div className="h-full flex flex-col space-y-6 relative pb-16">
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border shadow-lg rounded-full px-6 py-3 flex items-center space-x-6 z-50 animate-in slide-in-from-bottom-5">
          <span className="text-sm font-semibold text-foreground">
            {t('settings.unsavedChanges') || 'You have unsaved changes'}
          </span>
          <div className="flex space-x-2">
            <button onClick={handleDiscard} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-full transition-colors">
              {t('settings.discard') || 'Discard'}
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full transition-colors">
              {t('settings.saveChanges') || 'Save Changes'}
            </button>
          </div>
        </div>
      )}
      <header>
        <h1 className="text-3xl font-black text-foreground tracking-tight">{t('nav.settings') || 'Settings'}</h1>
      </header>
      
      <div className="flex flex-1 overflow-hidden bg-card border border-border rounded-2xl shadow-sm">
        <div className="w-64 border-r border-border bg-background p-4 space-y-1 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`} />
              <span>{tab.label || tab.id}</span>
            </button>
          ))}
        </div>
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto">
            {activeTab === 'account' && <AccountSettings />}
            {activeTab === 'general' && <GeneralSettings language={draftLanguage} setLanguage={setDraftLanguage} settings={draftSettings} updateSettings={updateSettings} t={t} />}
            {activeTab === 'schedule' && <ScheduleSettings settings={draftSettings} updateSettings={updateSettings} t={t} />}
            {activeTab === 'tasks' && <TaskSettings settings={draftSettings} updateSettings={updateSettings} t={t} />}
            {activeTab === 'categories' && <CategorySettings t={t} />}
            {activeTab === 'notifications' && <NotificationSettings settings={draftSettings} updateSettings={updateSettings} t={t} />}
            
            {activeTab === 'data' && <DataSettings t={t} />}
                    </div>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings({ language, setLanguage, settings, updateSettings, t }: any) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">{t('settings.language') || 'Language'}</h2>
        <div className="space-y-2">
          <Select
            value={language}
            onChange={(value) => setLanguage(value as any)}
            className="w-full sm:w-64"
            options={[
              { value: "en", label: "English" },
              { value: "vi", label: "Tiếng Việt" },
              { value: "zh", label: "中文" },
              { value: "ko", label: "한국어" }
            ]}
          />
        </div>
      </div>
      
      <hr className="border-border" />
      
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">{t('settings.appearance') || 'Appearance'}</h2>
        <div className="flex items-center space-x-3">
          {[
            { id: 'light', icon: Sun, label: t('settings.light') || 'Light' },
            { id: 'dark', icon: Moon, label: t('settings.dark') || 'Dark' },
            { id: 'system', icon: Monitor, label: t('settings.system') || 'System' },
            { id: 'cute', icon: Sparkles, label: t('settings.cute') || 'Cute' },
            { id: 'pink', icon: Heart, label: t('settings.pink') || 'Pink' }
          ].map(theme => (
            <button
              key={theme.id}
              onClick={() => updateSettings({ theme: theme.id })}
              className={`flex-1 flex flex-col items-center justify-center space-y-2 p-4 border rounded-xl transition-all ${settings.theme === theme.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-background text-muted-foreground'}`}
            >
              <theme.icon className="w-6 h-6" />
              <span className="text-sm font-semibold">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScheduleSettings({ settings, updateSettings, t }: any) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-2">{t('settings.defaultTimeSlot') || 'Default Time Slot (mins)'}</h3>
          <Select
            value={settings.defaultTimeSlot}
            onChange={(value) => updateSettings({ defaultTimeSlot: parseInt(value) })}
            options={[
              { value: "15", label: `15 ${t('settings.minutes') || 'minutes'}` },
              { value: "30", label: `30 ${t('settings.minutes') || 'minutes'}` },
              { value: "45", label: `45 ${t('settings.minutes') || 'minutes'}` },
              { value: "60", label: `60 ${t('settings.minutes') || 'minutes'}` }
            ]}
          />
        </div>
        
        <div>
          <h3 className="text-sm font-bold text-foreground mb-2">{t('settings.workloadTimelineInterval') || 'Workload Timeline Interval'}</h3>
          <Select
            value={settings.analytics?.timelineInterval || 60}
            onChange={(value) => updateSettings({ analytics: { ...settings.analytics, timelineInterval: parseInt(value) } })}
            options={[
              { value: "15", label: `15 ${t('settings.minutes') || 'minutes'}` },
              { value: "30", label: `30 ${t('settings.minutes') || 'minutes'}` },
              { value: "60", label: `1 ${t('settings.hour') || 'hour'}` },
              { value: "120", label: `2 ${t('settings.hours') || 'hours'}` }
            ]}
          />
        </div>
        
        <div>
          <h3 className="text-sm font-bold text-foreground mb-2">{t('settings.timeFormat') || 'Time Format'}</h3>
          <Select
            value={settings.timeFormat}
            onChange={(value) => updateSettings({ timeFormat: value })}
            options={[
              { value: "12h", label: t('settings.h12') || '12-hour (AM/PM)' },
              { value: "24h", label: t('settings.h24') || '24-hour' }
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function TaskSettings({ settings, updateSettings, t }: any) {
  const categories = useStore(s => s.categories);
  
  const updateTaskDefaults = (updates: any) => {
    updateSettings({ taskDefaults: { ...settings.taskDefaults, ...updates } });
  };
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">{t('settings.taskDefaults') || 'Task Defaults'}</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">{t('settings.defaultPriority') || 'Priority'}</label>
            <Select
              value={settings.taskDefaults.priority}
              onChange={(value) => updateTaskDefaults({ priority: value })}
              options={[
                { value: "Low", label: t('priority.low') },
                { value: "Medium", label: t('priority.medium') },
                { value: "High", label: t('priority.high') },
                { value: "Urgent", label: t('priority.urgent') }
              ]}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">{t('settings.defaultStatus') || 'Status'}</label>
            <Select
              value={settings.taskDefaults.status}
              onChange={(value) => updateTaskDefaults({ status: value })}
              options={[
                { value: "Not Started", label: t('status.notStarted') },
                { value: "In Progress", label: t('status.inProgress') }
              ]}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">{t('settings.defaultDuration') || 'Duration (mins)'}</label>
            <input
              type="number"
              value={settings.taskDefaults.duration}
              onChange={(e) => updateTaskDefaults({ duration: parseInt(e.target.value) })}
              className="w-full border border-border rounded-lg text-sm bg-card px-3 py-2 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">{t('settings.defaultCategory') || 'Category'}</label>
            <Select
              value={settings.taskDefaults.categoryId || ''}
              onChange={(value) => updateTaskDefaults({ categoryId: value || null })}
              options={[
                { value: "", label: t('settings.noDefault') || 'No Default' },
                ...categories.filter(c => !c.archived).map(c => ({ value: c.id, label: c.name }))
              ]}
            />
          </div>
        </div>
      </div>
      
      
      <hr className="border-border" />
      
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">{t('settings.durationPresets') || 'Task Duration Presets'}</h2>
        <div className="space-y-3 max-w-sm">
          {(settings.taskDurationPresets || []).map((preset: number, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-card border border-border rounded-lg">
              <span className="text-sm font-semibold">{Math.floor(preset/60) > 0 ? `${Math.floor(preset/60)}h ` : ''}{preset%60 > 0 ? `${preset%60}m` : ''}</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => {
                    const newPresets = [...(settings.taskDurationPresets || [])];
                    if (i > 0) {
                      [newPresets[i-1], newPresets[i]] = [newPresets[i], newPresets[i-1]];
                      updateSettings({ taskDurationPresets: newPresets });
                    }
                  }}
                  disabled={i === 0}
                  className="p-1 hover:bg-muted text-muted-foreground rounded disabled:opacity-30"
                >
                  ↑
                </button>
                <button 
                  onClick={() => {
                    const newPresets = [...(settings.taskDurationPresets || [])];
                    if (i < newPresets.length - 1) {
                      [newPresets[i+1], newPresets[i]] = [newPresets[i], newPresets[i+1]];
                      updateSettings({ taskDurationPresets: newPresets });
                    }
                  }}
                  disabled={i === (settings.taskDurationPresets?.length || 0) - 1}
                  className="p-1 hover:bg-muted text-muted-foreground rounded disabled:opacity-30"
                >
                  ↓
                </button>
                <button 
                  onClick={() => {
                    const newPresets = (settings.taskDurationPresets || []).filter((_, index) => index !== i);
                    updateSettings({ taskDurationPresets: newPresets });
                  }}
                  className="p-1 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          <div className="flex items-center gap-2 pt-2">
            <input 
              type="number" 
              id="newPresetHours" 
              placeholder={t('common.hours') || 'Hours'} 
              min="0"
              className="w-20 text-sm bg-background border border-border rounded-md px-2 py-1 outline-none" 
            />
            <input 
              type="number" 
              id="newPresetMins" 
              placeholder={t('common.minutes') || 'Minutes'} 
              min="0"
              max="59"
              className="w-20 text-sm bg-background border border-border rounded-md px-2 py-1 outline-none" 
            />
            <button 
              onClick={() => {
                const hInput = document.getElementById('newPresetHours') as HTMLInputElement;
                const mInput = document.getElementById('newPresetMins') as HTMLInputElement;
                const h = parseInt(hInput.value) || 0;
                const m = parseInt(mInput.value) || 0;
                const total = h * 60 + m;
                if (total > 0 && !(settings.taskDurationPresets || []).includes(total)) {
                  updateSettings({ taskDurationPresets: [...(settings.taskDurationPresets || []), total] });
                  hInput.value = '';
                  mInput.value = '';
                }
              }}
              className="px-3 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90"
            >
              {t('settings.addDuration') || 'Add Duration'}
            </button>
          </div>
        </div>
      </div>

      <hr className="border-border" />
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">{t('settings.taskCompletion') || 'Completion Behavior'}</h2>
        <div className="space-y-3">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="completion"
              checked={settings.completionBehavior === 'auto'}
              onChange={() => updateSettings({ completionBehavior: 'auto' })}
              className="mt-1 w-4 h-4 text-primary focus:ring-primary"
            />
            <div>
              <div className="text-sm font-bold text-foreground">{t('settings.autoComplete')}</div>
              <div className="text-xs text-muted-foreground">{t('settings.autoCompleteMsg')}</div>
            </div>
          </label>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="completion"
              checked={settings.completionBehavior === 'ask'}
              onChange={() => updateSettings({ completionBehavior: 'ask' })}
              className="mt-1 w-4 h-4 text-primary focus:ring-primary"
            />
            <div>
              <div className="text-sm font-bold text-foreground">{t('settings.askComplete')}</div>
              <div className="text-xs text-muted-foreground">{t('settings.autoCompleteMsg')}</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

function CategorySettings({ t }: any) {
  const categories = useStore(s => s.categories);
  const tasks = useTasks();
  const addCategory = useStore(s => s.addCategory);
  const updateCategory = useStore(s => s.updateCategory);
  const deleteCategory = useStore(s => s.deleteCategory);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', color: '#3b82f6', icon: 'tag', description: '', archived: false });
  
  const resetForm = () => {
    setFormData({ name: '', color: '#3b82f6', icon: 'tag', description: '', archived: false });
    setIsAdding(false);
    setEditingId(null);
  };
  
  const startEdit = (cat: Category) => {
    setFormData({ name: cat.name, color: cat.color, icon: cat.icon || 'tag', description: cat.description || '', archived: !!cat.archived });
    setEditingId(cat.id);
    setIsAdding(false);
  };
  
  const handleSave = () => {
    if (!formData.name.trim()) return;
    
    if (editingId) {
      updateCategory(editingId, formData);
    } else {
      addCategory({ name: formData.name, color: formData.color, icon: formData.icon, description: formData.description, archived: false });
    }
    resetForm();
  };
  
  const handleDelete = (catId: string) => {
    const usageCount = tasks.filter(taskItem => taskItem.categoryId === catId).length;
    if (usageCount > 0) {
      if (window.confirm(t('messages.confirmDeleteCategory'))) {
        deleteCategory(catId);
      }
    } else {
      deleteCategory(catId);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{t('settings.categories') || 'Category Management'}</h2>
        <button 
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="flex items-center px-3 py-1.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" /> {t('settings.addCategory')}
        </button>
      </div>
      
      {(isAdding || editingId) && (
        <div className="p-4 bg-background border border-border rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-foreground">{editingId ? t('settings.editCategory') : t('settings.addCategory')}</h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-muted-foreground"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('settings.categoryName')}</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full border border-border rounded px-3 py-2 text-sm outline-none"
                placeholder={t('settings.categoryName')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('settings.color')}</label>
              <div className="flex space-x-2">
                <input 
                  type="color" 
                  value={formData.color} 
                  onChange={e => setFormData({...formData, color: e.target.value})}
                  className="w-10 h-10 rounded border-0 outline-none cursor-pointer"
                />
                <input 
                  type="text" 
                  value={formData.color} 
                  onChange={e => setFormData({...formData, color: e.target.value})}
                  className="flex-1 border border-border rounded px-3 py-2 text-sm outline-none uppercase font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('settings.icon') || 'Icon'}</label>
              <div className="flex space-x-2 overflow-x-auto p-1 py-2 scrollbar-hide">
                {['tag', 'book', 'briefcase', 'activity', 'book-open', 'user', 'heart', 'star', 'coffee', 'smile', 'music', 'flower', 'cloud', 'sun', 'moon'].map(ic => (
                  <button 
                    key={ic}
                    type="button"
                    onClick={() => setFormData({...formData, icon: ic})}
                    className={`p-2 rounded-lg flex-shrink-0 ${formData.icon === ic ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:bg-border'}`}
                  >
                    <DynamicIcon name={ic} className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('settings.description')}</label>
              <input 
                type="text" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full border border-border rounded px-3 py-2 text-sm outline-none"
              />
            </div>
            {editingId && (
              <div className="sm:col-span-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.archived} 
                    onChange={e => setFormData({...formData, archived: e.target.checked})}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm font-semibold text-foreground">{t('settings.archiveCategory')}</span>
                </label>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <button onClick={resetForm} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-lg">{t('common.cancel')}</button>
            <button onClick={handleSave} disabled={!formData.name.trim()} className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg disabled:opacity-50">{t('common.save')}</button>
          </div>
        </div>
      )}
      
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background border-b border-border">
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.category')}</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('analytics.tasks')}</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.status')}</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">{t('settings.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map(cat => {
              const taskCount = tasks.filter(taskItem => taskItem.categoryId === cat.id).length;
              return (
                <tr key={cat.id} className="hover:bg-background transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded flex items-center justify-center text-white" style={{ backgroundColor: cat.color }}>
     <DynamicIcon name={cat.icon || 'tag'} className="w-3 h-3" />
   </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">{cat.name}</div>
                        {cat.description && <div className="text-xs text-muted-foreground">{cat.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-muted-foreground">{taskCount}</td>
                  <td className="px-4 py-3">
                    {cat.archived ? 
                      <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded">{t('settings.archiveCategory')}</span> : 
                      <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded">{t('settings.restoreCategory')}</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => startEdit(cat)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {categories.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">{t('messages.noResults') || 'No categories found.'}</div>
        )}
      </div>
    </div>
  );
}

function NotificationSettings({ settings, updateSettings, t }: any) {
  const updateNotif = (updates: any) => {
    updateSettings({ notifications: { ...settings.notifications, ...updates } });
  };
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">{t('settings.notifications') || 'Notifications'}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-card shadow-sm">
            <div>
              <div className="font-bold text-foreground text-sm">{t('settings.taskReminders')}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('settings.remindBefore')}</div>
            </div>
            <div className="flex items-center space-x-4">
              {settings.notifications.taskReminders && (
                <Select
                  value={settings.notifications.reminderTime}
                  onChange={(value) => updateNotif({ reminderTime: parseInt(value) })}
                  className="w-32"
                  options={[
                    { value: "5", label: t('settings.min5') },
                    { value: "10", label: t('settings.min10') },
                    { value: "15", label: t('settings.min15') },
                    { value: "30", label: t('settings.min30') },
                    { value: "60", label: t('settings.hour1') }
                  ]}
                />
              )}
              <input
                type="checkbox"
                checked={settings.notifications.taskReminders}
                onChange={(e) => updateNotif({ taskReminders: e.target.checked })}
                className="w-5 h-5 text-primary rounded"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-card shadow-sm">
            <div>
              <div className="font-bold text-foreground text-sm">{t('settings.overdueAlerts')}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('settings.remindOverdue')}</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.overdueAlerts}
              onChange={(e) => updateNotif({ overdueAlerts: e.target.checked })}
              className="w-5 h-5 text-primary rounded"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-card shadow-sm">
            <div>
              <div className="font-bold text-foreground text-sm">{t('settings.dailySummary')}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('settings.remindSummary')}</div>
            </div>
            <div className="flex items-center space-x-4">
              {settings.notifications.dailySummary && (
                <TimeInput value={settings.notifications.dailySummaryTime} onChange={(val) => updateNotif({ dailySummaryTime: val })} className="w-[85px] text-sm border border-border rounded px-2 py-1 outline-none text-center" />
              )}
              <input
                type="checkbox"
                checked={settings.notifications.dailySummary}
                onChange={(e) => updateNotif({ dailySummary: e.target.checked })}
                className="w-5 h-5 text-primary rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataSettings({ t }: any) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const resetData = useStore(s => s.resetData);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">{t('settings.data') || 'Data Management'}</h2>
        
        <DataManagement />
      </div>
      
      <div className="p-6 border border-red-200 bg-red-50 rounded-xl space-y-4">
        <div className="flex items-center space-x-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-bold">{t('settings.dangerZone')}</h3>
        </div>
        <p className="text-sm text-red-600/80">{t('settings.irreversible')}</p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <p className="text-sm text-muted-foreground font-medium mb-1">{t('messages.resetAppBackupWarning') || 'Consider exporting a backup before resetting the application.'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button 
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 text-sm font-bold rounded-lg transition-colors shadow-sm"
          >
            {t('messages.resetApplication') || 'Reset Application'}
          </button>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card text-card-foreground w-full max-w-md rounded-2xl shadow-2xl p-6 border border-border">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle size={28} />
              <h2 className="text-xl font-bold">{t('messages.resetApplication') || 'Reset Application'}</h2>
            </div>
            
            {resetSuccessMsg ? (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl font-medium mb-6">
                {resetSuccessMsg}
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  <p className="font-semibold">{t('messages.resetAppConfirm1') || 'Reset the entire application?'}</p>
                  <p className="text-red-600/90 text-sm font-medium">{t('messages.resetAppConfirm2') || 'This will permanently delete all tasks, time records, categories, recurring schedules, and personal settings.'}</p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2">{t('messages.resetAppTypeConfirm') || 'Type RESET to confirm'}</label>
                  <input
                    type="text"
                    value={resetConfirmationText}
                    onChange={(e) => setResetConfirmationText(e.target.value)}
                    placeholder="RESET"
                    className="w-full bg-background border border-border p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-mono"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmationText('');
                  setResetSuccessMsg('');
                }}
                className="px-4 py-2 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg font-bold transition-colors"
              >
                {resetSuccessMsg ? t('messages.cancel') : t('messages.cancel')}
              </button>
              
              {!resetSuccessMsg && (
                <button
                  onClick={() => {
                    try {
                      resetData('all');
                      setResetSuccessMsg(t('messages.resetAppSuccess') || 'The application has been reset to its initial state.');
                      setTimeout(() => {
                        setShowResetModal(false);
                        setResetConfirmationText('');
                        setResetSuccessMsg('');
                      }, 2500);
                    } catch(err) {
                      alert(t('messages.resetAppError') || 'Unable to reset the application. Please try again.');
                    }
                  }}
                  disabled={resetConfirmationText !== 'RESET'}
                  className="px-5 py-2 bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 rounded-lg font-bold shadow-md transition-colors"
                >
                  {t('messages.resetApplication') || 'Reset Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}