import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { syncFirebase } from '../../firebaseHelpers';
import { defaultCategories, defaultSettings } from '../../store/useStore';
import { AlertTriangle, Loader2 } from 'lucide-react';

export const MigrationModal: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const store = useStore();
  const [migrating, setMigrating] = useState(false);

    const handleImport = async () => {
    setMigrating(true);
    try {
      await syncFirebase.importLocalDataToFirebase({
        tasks: store.tasks,
        recurringTasks: store.recurringTasks,
        categories: store.categories,
        timeEntries: store.timeEntries,
        settings: store.settings,
        language: store.language
      });
    } catch (err) {
      console.error("Migration import error:", err);
    } finally {
      setMigrating(false);
      onComplete();
    }
  };

    const handleFreshStart = async () => {
    setMigrating(true);
    try {
      store.overwriteStore({
        tasks: [],
        recurringTasks: [],
        categories: defaultCategories,
        timeEntries: [],
        settings: defaultSettings,
        language: 'en'
      });
      // Create empty profile
      await syncFirebase.updateProfile({
        settings: defaultSettings,
        language: 'en',
        theme: defaultSettings.theme
      });
    } catch (err) {
      console.error("Fresh start error:", err);
    } finally {
      setMigrating(false);
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center space-x-3 text-amber-600">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-lg font-bold text-foreground">Local Data Found</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          You have existing FlowState data on this device. Would you like to import it into this account?
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleImport}
            disabled={migrating}
            className="w-full flex justify-center py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {migrating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Import Existing Data'}
          </button>
          
          <button
            onClick={handleFreshStart}
            disabled={migrating}
            className="w-full py-3 px-4 rounded-xl bg-muted text-muted-foreground font-semibold hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
};
