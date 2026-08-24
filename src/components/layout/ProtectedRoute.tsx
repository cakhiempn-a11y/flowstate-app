import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStore, defaultCategories, defaultSettings } from '../../store/useStore';
import { syncFirebase } from '../../firebaseHelpers';
import { Loader2 } from 'lucide-react';
import { MigrationModal } from '../auth/MigrationModal';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const [fetchingData, setFetchingData] = useState(true);
  const [showMigration, setShowMigration] = useState(false);
  const overwriteStore = useStore(state => state.overwriteStore);
  const hasInitialized = useStore(state => state.hasInitialized);
  const storeTasks = useStore(state => state.tasks);
  
    useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    if (!loading) {
      if (user) {
        timeoutId = setTimeout(() => {
          if (isMounted && fetchingData) {
            console.warn("Timeout fetching user data");
            setFetchingData(false);
          }
        }, 10000);

        // Fetch user data
        syncFirebase.fetchAllUserData()
          .then(data => {
            if (!isMounted) return;
            if (data) {
              // Always hydrate store with whatever we got from Firebase, falling back to defaults to ensure complete isolation
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
              } else {
                hydrationData.settings = defaultSettings;
              }
              if (data.profile && data.profile.language) {
                hydrationData.language = data.profile.language;
              } else {
                hydrationData.language = 'en';
              }
              
              // Ensure Private Space is locked upon hydration to prevent local state leaking
              hydrationData.isSpecialFeaturesUnlocked = false;
              
              // Ensure timers are reset
              hydrationData.activeTimer = null;
              
              // Only show migration if we have local tasks and the Firebase account is completely empty
              const hasFirebaseData = !!data.profile || data.tasks.length > 0 || data.recurringTasks.length > 0 || data.timeEntries.length > 0;
              if (!hasFirebaseData && storeTasks.length > 0) {
                setShowMigration(true);
                setFetchingData(false); // Must set to false so the modal can render
              } else {
                overwriteStore(hydrationData);
                setFetchingData(false);
              }
            } else {
              setFetchingData(false);
            }
          })
          .catch(err => {
            console.warn("Firebase fetch error:", err);
            if (isMounted) {
              setFetchingData(false);
            }
          });
      } else {
        setFetchingData(false);
      }
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, loading]);

  if (loading || fetchingData) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Outlet />
      {showMigration && (
        <MigrationModal onComplete={() => {
          setShowMigration(false);
          setFetchingData(false);
        }} />
      )}
    </>
  );
};
