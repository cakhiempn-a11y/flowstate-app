import React, { useState, useRef, useMemo } from 'react';
import { Download, Upload, AlertCircle, Calendar as CalendarIcon, FileJson, CheckCircle2, X } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { useStore } from '../store/useStore';
import { useTasks } from '../store/useTasks';
import { DatePicker } from './DatePicker';
import { Select } from './ui/Select';
import { format, parseISO, isWithinInterval, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfDay, endOfDay, isBefore, isEqual } from 'date-fns';

export function DataManagement() {
  const { t } = useTranslation();
  const tasks = useTasks();
  const categories = useStore(s => s.categories);
  const timeEntries = useStore(s => s.timeEntries);
  const settings = useStore(s => s.settings);
  const importData = useStore(s => s.importData);
  const profile = useStore(s => s.profile);

  // Modals state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Export State
  const [exportRange, setExportRange] = useState('all');
  const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState('');

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [importError, setImportError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate filtered export data
  const filteredExportData = useMemo(() => {
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    const now = new Date();

    switch (exportRange) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'last7':
        startDate = startOfDay(subDays(now, 7));
        endDate = endOfDay(now);
        break;
      case 'last30':
        startDate = startOfDay(subDays(now, 30));
        endDate = endOfDay(now);
        break;
      case 'thisMonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      case 'thisYear':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case 'custom':
        if (customStart && customEnd) {
          startDate = startOfDay(parseISO(customStart));
          endDate = endOfDay(parseISO(customEnd));
        }
        break;
      case 'all':
      default:
        break;
    }

    let filteredTasks = tasks;
    let filteredTimeEntries = timeEntries;

    if (startDate && endDate) {
      // Validate dates
      if (isBefore(endDate, startDate)) {
        return { error: t('dataManagement.invalidDateRange') || 'Invalid date range' };
      }

      filteredTasks = tasks.filter(task => {
        // Use scheduled date if available, otherwise due date, otherwise created date
        const dateStr = task.date || task.deadline || task.createdAt;
        if (!dateStr) return false;
        
        try {
          // Some tasks have timestamp in createdAt instead of iso string, some have yyyy-MM-dd in date
          const taskDate = parseISO(dateStr.length > 10 ? dateStr : dateStr + "T12:00:00Z");
          if (isNaN(taskDate.getTime())) return true; // keep if invalid date format
          
          return taskDate.getTime() >= startDate!.getTime() && taskDate.getTime() <= endDate!.getTime();
        } catch(e) {
          return true; // keep if parsing fails to avoid data loss
        }
      });

      filteredTimeEntries = timeEntries.filter(entry => {
        const dateStr = entry.startTime || entry.createdAt;
        if (!dateStr) return false;
        try {
          const entryDate = parseISO(dateStr.length > 10 ? dateStr : dateStr + "T12:00:00Z");
          if (isNaN(entryDate.getTime())) return true;
          return entryDate.getTime() >= startDate!.getTime() && entryDate.getTime() <= endDate!.getTime();
        } catch(e) {
          return true;
        }
      });
    }

    // Prepare full data payload
    // Always include non-date configuration
    return {
      data: {
        version: "1.1",
        exportedAt: new Date().toISOString(),
        profile,
        settings,
        categories,
        tasks: filteredTasks,
        timeEntries: filteredTimeEntries
      },
      startDate,
      endDate
    };
  }, [tasks, categories, timeEntries, settings, profile, exportRange, customStart, customEnd, t]);

  const handleExport = () => {
    setExportError('');
    if (filteredExportData.error) {
      setExportError(filteredExportData.error);
      return;
    }

    try {
      const data = filteredExportData.data;
      if (!data) throw new Error("No data");

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      let filename = `flowstate-all-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
      if (filteredExportData.startDate && filteredExportData.endDate) {
        filename = `flowstate-${format(filteredExportData.startDate, 'yyyy-MM-dd')}-to-${format(filteredExportData.endDate, 'yyyy-MM-dd')}.json`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      setExportError(t('messages.exportError') || 'Export failed');
    }
  };

  const handleImportSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const data = JSON.parse(raw);
        
        // Basic validation
        if (!data || typeof data !== 'object') {
          throw new Error(t('dataManagement.invalidJson') || 'Invalid JSON');
        }
        
        // Count items
        const preview = {
          version: data.version || '1.0',
          exportedAt: data.exportedAt ? format(parseISO(data.exportedAt), 'PP pp') : 'Unknown',
          tasksCount: Array.isArray(data.tasks) ? data.tasks.length : 0,
          categoriesCount: Array.isArray(data.categories) ? data.categories.length : 0,
          timeEntriesCount: Array.isArray(data.timeEntries) ? data.timeEntries.length : 0,
          rawData: data
        };
        
        setImportPreview(preview);
      } catch (err: any) {
        setImportError(err.message || t('dataManagement.invalidJson') || 'Invalid JSON file');
      }
    };
    reader.onerror = () => {
      setImportError(t('messages.importError') || 'Failed to read file');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!importPreview?.rawData) return;
    
    if (window.confirm(t('dataManagement.importConfirm') || 'Importing will add/restore data from this file. Do you want to continue?')) {
      try {
        importData(importPreview.rawData);
        alert(t('messages.importSuccess') || 'Data imported successfully!');
        setShowImportModal(false);
        setImportFile(null);
        setImportPreview(null);
      } catch (e) {
        console.error(e);
        alert(t('messages.importError') || 'Failed to import data');
      }
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 border border-border rounded-xl bg-card shadow-sm flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-foreground">{t('settings.exportBackup')}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('settings.downloadJson')}</div>
          </div>
          <button 
            onClick={() => setShowExportModal(true)} 
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-bold rounded-lg transition-colors"
          >
            {t('settings.exportData')}
          </button>
        </div>
        
        <div className="p-4 border border-border rounded-xl bg-card shadow-sm flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-foreground">{t('settings.importBackup')}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('settings.restoreExport')}</div>
          </div>
          <button 
            onClick={() => setShowImportModal(true)} 
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-bold rounded-lg transition-colors cursor-pointer"
          >
            {t('settings.importData')}
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card text-card-foreground w-full max-w-md rounded-2xl shadow-2xl p-6 border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">{t('settings.exportData') || 'Export Data'}</h2>
              </div>
              <button onClick={() => setShowExportModal(false)} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  {t('dataManagement.exportRange') || 'Export date range'}
                </label>
                <Select
                  value={exportRange}
                  onChange={(val) => setExportRange(val)}
                  options={[
                    { value: 'all', label: t('dataManagement.allData') || 'All data' },
                    { value: 'today', label: t('dataManagement.today') || 'Today' },
                    { value: 'last7', label: t('dataManagement.last7Days') || 'Last 7 days' },
                    { value: 'last30', label: t('dataManagement.last30Days') || 'Last 30 days' },
                    { value: 'thisMonth', label: t('dataManagement.thisMonth') || 'This month' },
                    { value: 'lastMonth', label: t('dataManagement.lastMonth') || 'Last month' },
                    { value: 'thisYear', label: t('dataManagement.thisYear') || 'This year' },
                    { value: 'custom', label: t('dataManagement.custom') || 'Custom' }
                  ]}
                  className="w-full"
                />
              </div>

              {exportRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">
                      {t('dataManagement.fromDate') || 'From date'}
                    </label>
                    <DatePicker 
                      value={customStart}
                      onChange={setCustomStart}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">
                      {t('dataManagement.toDate') || 'To date'}
                    </label>
                    <DatePicker 
                      value={customEnd}
                      onChange={setCustomEnd}
                    />
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
                {filteredExportData.error ? (
                  <p className="text-sm font-medium text-red-500 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {filteredExportData.error}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredExportData.startDate && filteredExportData.endDate && (
                       <p className="text-xs font-bold text-muted-foreground mb-2">
                         {t('dataManagement.rangeLabel', { start: format(filteredExportData.startDate, 'dd/MM/yyyy'), end: format(filteredExportData.endDate, 'dd/MM/yyyy') }) || `Range: ${format(filteredExportData.startDate, 'dd/MM/yyyy')} - ${format(filteredExportData.endDate, 'dd/MM/yyyy')}`}
                       </p>
                    )}
                    <ul className="text-sm font-medium text-foreground space-y-1">
                      <li>{t('dataManagement.countTasks', { count: filteredExportData.data?.tasks?.length || 0 }) || `Tasks: ${filteredExportData.data?.tasks?.length || 0}`}</li>
                      <li>{t('dataManagement.countTimeEntries', { count: filteredExportData.data?.timeEntries?.length || 0 }) || `Time Entries: ${filteredExportData.data?.timeEntries?.length || 0}`}</li>
                      <li>{t('dataManagement.countCategories', { count: filteredExportData.data?.categories?.length || 0 }) || `Categories: ${filteredExportData.data?.categories?.length || 0}`}</li>
                    </ul>
                  </div>
                )}
              </div>

              {exportError && (
                <p className="text-sm text-red-500 font-medium">{exportError}</p>
              )}
              {exportSuccess && (
                <p className="text-sm text-emerald-500 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {t('dataManagement.exportSuccess') || 'Data exported successfully.'}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button 
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl text-sm transition-colors"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button 
                onClick={handleExport}
                disabled={!!filteredExportData.error}
                className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {t('settings.exportData') || 'Export Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card text-card-foreground w-full max-w-md rounded-2xl shadow-2xl p-6 border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">{t('settings.importData') || 'Import Data'}</h2>
              </div>
              <button onClick={() => { setShowImportModal(false); setImportPreview(null); setImportFile(null); }} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              {!importPreview ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/30">
                  <FileJson className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground mb-4">Select a JSON backup file</p>
                  <label className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg transition-colors cursor-pointer hover:bg-primary/90">
                    Browse File
                    <input type="file" accept=".json" onChange={handleImportSelect} ref={fileInputRef} className="hidden" />
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                   <div className="p-4 bg-muted/50 rounded-xl border border-border/50 space-y-3">
                      <p className="text-sm font-bold text-foreground border-b border-border/50 pb-2">
                        {t('dataManagement.preview') || 'Preview'}
                      </p>
                      <ul className="text-sm font-medium text-muted-foreground space-y-2">
                        <li><span className="text-foreground">Version:</span> {importPreview.version}</li>
                        <li><span className="text-foreground">Export Date:</span> {importPreview.exportedAt}</li>
                        <li><span className="text-foreground">{t('dataManagement.countTasks', { count: importPreview.tasksCount }) || `Tasks: ${importPreview.tasksCount}`}</span></li>
                        <li><span className="text-foreground">{t('dataManagement.countTimeEntries', { count: importPreview.timeEntriesCount }) || `Time Entries: ${importPreview.timeEntriesCount}`}</span></li>
                        <li><span className="text-foreground">{t('dataManagement.countCategories', { count: importPreview.categoriesCount }) || `Categories: ${importPreview.categoriesCount}`}</span></li>
                      </ul>
                   </div>
                   <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                     {t('dataManagement.importConfirm') || 'Importing will add/restore data from this file. Do you want to continue?'}
                   </p>
                </div>
              )}

              {importError && (
                <p className="text-sm text-red-500 font-medium p-3 bg-red-50 dark:bg-red-950/30 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {importError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button 
                onClick={() => { setShowImportModal(false); setImportPreview(null); setImportFile(null); }}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl text-sm transition-colors"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              {importPreview && (
                <button 
                  onClick={handleConfirmImport}
                  className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl text-sm transition-colors"
                >
                  {t('settings.importData') || 'Import Data'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
