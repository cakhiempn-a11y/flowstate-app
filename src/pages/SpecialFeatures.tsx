import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { Heart, Lock, Unlock, Eye, EyeOff, Loader2, Plus, Calendar as CalendarIcon, Info, Edit2, Trash2 } from 'lucide-react';
import { hashPin } from '../lib/pinUtils';
import { useAuth } from '../contexts/AuthContext';
import { syncFirebase } from '../firebaseHelpers';
import { menstrualHelpers, MenstrualCycle } from '../lib/menstrualHelpers';
import { parseISO, format, differenceInDays, addDays, subDays } from 'date-fns';
import { cn } from '../lib/utils';

export default function SpecialFeatures() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const profile = useStore(state => state.profile);
  const isUnlocked = useStore(state => state.isSpecialFeaturesUnlocked);
  const setUnlocked = useStore(state => state.setSpecialFeaturesUnlocked);
  const updateProfileState = useStore(state => state.updateProfileState);
  
  const isSet = !!profile?.specialFeaturesPinHash && profile?.specialFeaturesPinEnabled;
  
  // Pin Setup/Unlock State
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Anti-Brute Force
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  
  // App State
  const [cycles, setCycles] = useState<MenstrualCycle[]>([]);
  const [fetchingData, setFetchingData] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  
  // Edit & Delete states
  const [editingCycle, setEditingCycle] = useState<MenstrualCycle | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Partner Reminders State
  const [partnerReminders, setPartnerReminders] = useState({
    enabled: false,
    shareNextPeriod: true,
    shareCurrentStatus: false,
    shareOvulation: false,
    shareFertileWindow: false,
    reminderType: 'upcoming',
    customMessage: ''
  });

  useEffect(() => {
    if (isUnlocked) {
      // loadCycles();
    }
  }, [isUnlocked]);
  
  useEffect(() => {
    if (profile?.partnerReminders) {
      setPartnerReminders(profile.partnerReminders);
    }
  }, [profile]);

  useEffect(() => {
    let timer: any;
    if (cooldownUntil && cooldownUntil > Date.now()) {
      timer = setInterval(() => {
        if (Date.now() >= cooldownUntil) {
          setCooldownUntil(null);
          setFailedAttempts(0);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  const loadCycles = async () => {
    setFetchingData(true);
    try {
      const data = await menstrualHelpers.getCycles();
      setCycles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingData(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (pin.length !== 6) {
      setError(t('specialFeatures.pinLength') || 'PIN must be exactly 6 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError(t('specialFeatures.pinMismatch') || 'PINs do not match');
      return;
    }
    
    setLoading(true);
    try {
      const hashed = await hashPin(pin, user.uid);
      await syncFirebase.updateProfile({
        specialFeaturesPinHash: hashed,
        specialFeaturesPinEnabled: true
      });
      updateProfileState({
        specialFeaturesPinHash: hashed,
        specialFeaturesPinEnabled: true
      });
      setUnlocked(true);
      setPin('');
      setConfirmPin('');
    } catch (err) {
      setError('Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.specialFeaturesPinHash) return;
    
    if (cooldownUntil && Date.now() < cooldownUntil) {
      return;
    }
    
    setLoading(true);
    try {
      const hashed = await hashPin(pin, user.uid);
      if (hashed === profile.specialFeaturesPinHash) {
        setUnlocked(true);
        setPin('');
        setFailedAttempts(0);
      } else {
        setError(t('specialFeatures.pinIncorrect') || 'Incorrect PIN.');
        const attempts = failedAttempts + 1;
        setFailedAttempts(attempts);
        if (attempts >= 5) {
          setCooldownUntil(Date.now() + 60000); // 1 minute cooldown
          setError(t('specialFeatures.tooManyAttempts') || 'Too many failed attempts.');
        }
      }
    } catch (err) {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) return;
    
    let duration: number | undefined;
    if (endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      if (end < start) {
        setError(t('specialFeatures.invalidDates') || 'End date cannot be before start date.');
        return;
      }
      duration = differenceInDays(end, start) + 1;
    }
    
    const newCycle: MenstrualCycle = {
      id: editingCycle ? editingCycle.id : crypto.randomUUID(),
      startDate,
      endDate: endDate || undefined,
      duration
    };
    
    setLoading(true);
    try {
      await menstrualHelpers.saveCycle(newCycle);
      setShowAddForm(false);
      setEditingCycle(null);
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setEndDate('');
      // loadCycles();
    } catch (err) {
      console.error(err);
      setError('Failed to save cycle');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditCycle = (cycle: MenstrualCycle) => {
    setEditingCycle(cycle);
    setStartDate(cycle.startDate);
    setEndDate(cycle.endDate || '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDeleteCycle = async () => {
    if (!showDeleteConfirm) return;
    setDeleteLoading(true);
    try {
      await menstrualHelpers.deleteCycle(showDeleteConfirm);
      setCycles(cycles.filter(c => c.id !== showDeleteConfirm));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Calculations (Estimates only)
  let avgCycleLength = 28;
  let estimatedNext: Date | null = null;
  let ovulationDate: Date | null = null;
  let fertileWindowStart: Date | null = null;
  let fertileWindowEnd: Date | null = null;
  
  if (cycles.length >= 2) {
    let totalLength = 0;
    let count = 0;
    for (let i = 0; i < cycles.length - 1; i++) {
      const current = parseISO(cycles[i].startDate);
      const prev = parseISO(cycles[i+1].startDate);
      const diff = differenceInDays(current, prev);
      if (diff > 15 && diff < 100) { // Reasonable cycle lengths
        totalLength += diff;
        count++;
      }
    }
    if (count > 0) {
      avgCycleLength = Math.round(totalLength / count);
    }
  }
  
  if (cycles.length > 0) {
    const lastStart = parseISO(cycles[0].startDate);
    estimatedNext = addDays(lastStart, avgCycleLength);
    if (cycles.length >= 2) {
      ovulationDate = subDays(estimatedNext, 14);
      fertileWindowStart = subDays(ovulationDate, 5);
      fertileWindowEnd = addDays(ovulationDate, 1);
    }
  }

  const renderInput = (
    label: string, 
    value: string, 
    setValue: (v: string) => void, 
    show: boolean, 
    setShow: (v: boolean) => void,
    isCooldown?: boolean
  ) => (
    <div className="mb-4">
      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
            setValue(val);
          }}
          disabled={isCooldown}
          className="w-full bg-muted/50 border-2 border-transparent focus:border-primary rounded-xl px-4 py-3 text-sm transition-all outline-none pr-12 disabled:opacity-50"
          placeholder="••••••"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          disabled={isCooldown}
          className="absolute right-3 top-3 p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  if (!isUnlocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-pink-50/30 dark:bg-pink-950/10 relative overflow-hidden">
        
        {/* Subtle Love-themed Background Illustration */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.08] dark:opacity-[0.05] blur-[1px] text-pink-600 dark:text-pink-300">
          <svg className="w-full max-w-5xl h-full min-h-[600px]" viewBox="0 0 800 600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <g transform="translate(100, 100) rotate(-15) scale(1.2)">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </g>
            <g transform="translate(150, 80) rotate(10) scale(0.6)">
              <path d="M12 2 L14 9 L21 11 L14 13 L12 20 L10 13 L3 11 L10 9 Z"/>
            </g>
            <g transform="translate(60, 200) rotate(25) scale(0.8)">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </g>
            
            <g transform="translate(650, 120) rotate(15) scale(1.3)">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </g>
            <g transform="translate(720, 180) rotate(-10) scale(0.7)">
              <path d="M12 2 L14 9 L21 11 L14 13 L12 20 L10 13 L3 11 L10 9 Z"/>
            </g>

            <g transform="translate(180, 480) rotate(-15) scale(1.5)">
              <rect x="2" y="4" width="20" height="14" rx="2" />
              <path d="M2 6l10 7 10-7" />
              <g transform="translate(8, -8) scale(0.4)">
                 <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/>
              </g>
            </g>
            <g transform="translate(100, 400) rotate(15) scale(0.5)">
              <path d="M12 2 L14 9 L21 11 L14 13 L12 20 L10 13 L3 11 L10 9 Z"/>
            </g>
            
            <g transform="translate(620, 450) rotate(-20) scale(1.2)">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </g>
            <g transform="translate(690, 400) rotate(10) scale(0.6)">
              <path d="M12 2 L14 9 L21 11 L14 13 L12 20 L10 13 L3 11 L10 9 Z"/>
            </g>
            <g transform="translate(550, 100) scale(1.1) rotate(20)">
               <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" opacity="0.4"/>
               <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" transform="translate(8, 4)" />
            </g>
            
            <path d="M200 150 Q 250 120, 300 160 T 400 140" strokeDasharray="4,6" strokeWidth="1.5" opacity="0.4"/>
            <path d="M600 400 Q 550 450, 500 420 T 400 460" strokeDasharray="4,6" strokeWidth="1.5" opacity="0.4"/>
            <path d="M150 250 Q 120 300, 160 350" strokeDasharray="4,6" strokeWidth="1.5" opacity="0.4"/>
            <path d="M650 250 Q 680 300, 640 350" strokeDasharray="4,6" strokeWidth="1.5" opacity="0.4"/>
          </svg>
        </div>

        <div className="max-w-md w-full bg-card/95 backdrop-blur border border-border/50 rounded-2xl p-8 shadow-xl relative z-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center mb-5 shadow-sm border border-pink-100 dark:border-pink-900/30">
              {/* Custom Cute Locked Heart */}
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Locked Heart">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                <rect x="9" y="10" width="6" height="5" rx="1" />
                <path d="M10 10V8a2 2 0 0 1 4 0v2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {t('specialFeatures.title') || 'Private Space'}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {isSet 
                ? (t('specialFeatures.subtitle') || 'Private Information')
                : (t('specialFeatures.securityDesc') || 'This PIN is used only to unlock Private Space and is separate from your login password.')}
            </p>
          </div>

          {!isSet ? (
            <form onSubmit={handleSetup} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
              {renderInput(t('specialFeatures.newPin') || 'New PIN', pin, setPin, showPin, setShowPin)}
              {renderInput(t('specialFeatures.confirmNewPin') || 'Confirm New PIN', confirmPin, setConfirmPin, showConfirm, setShowConfirm)}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-pink-600 text-white font-bold rounded-xl text-sm flex items-center justify-center shadow-sm hover:bg-pink-700 transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (t('specialFeatures.setUpPin') || 'Set up PIN')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
              {renderInput(t('specialFeatures.enterPin') || 'Enter PIN', pin, setPin, showPin, setShowPin, !!cooldownUntil)}
              
              <button
                type="submit"
                disabled={loading || !!cooldownUntil}
                className="w-full py-3 bg-pink-600 text-white font-bold rounded-xl text-sm flex items-center justify-center shadow-sm hover:bg-pink-700 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (t('specialFeatures.enterPin') || 'Enter PIN')}
              </button>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const lastSignIn = new Date(user?.metadata.lastSignInTime || 0).getTime();
                    const now = Date.now();
                    if (now - lastSignIn < 5 * 60 * 1000) {
                      if (window.confirm('Reset your PIN?')) {
                        syncFirebase.updateProfile({ specialFeaturesPinEnabled: false, specialFeaturesPinHash: '' })
                          .then(() => updateProfileState({ specialFeaturesPinEnabled: false, specialFeaturesPinHash: '' }));
                      }
                    } else {
                      alert('For security, please log out and log back in to reset your PIN.');
                    }
                  }}
                  className="text-xs text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 font-medium transition-colors"
                >
                  {t('specialFeatures.forgotPin') || 'Forgot PIN?'}
                </button>
              </div>
              
              {cooldownUntil && (
                <p className="text-center text-xs text-red-600 font-medium">
                  {Math.ceil((cooldownUntil - Date.now()) / 1000)}s remaining
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8 min-h-[calc(100vh-8rem)] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t('specialFeatures.title') || 'Private Space'}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Lock className="w-4 h-4" />
                <span>{t('specialFeatures.privateInfo') || 'Private Information'}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setUnlocked(false)}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {t('specialFeatures.lock') || 'Lock'}
          </button>
        </div>

        {/* Development Message */}
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
          <div className="max-w-md w-full bg-card border border-border rounded-3xl p-10 shadow-sm flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center mb-6 shadow-sm border border-pink-100 dark:border-pink-900/30">
              <Heart className="w-10 h-10 animate-pulse" />
            </div>
            <p className="text-lg font-bold text-foreground leading-relaxed">
              {t('specialFeatures.devMessage') || 'Tính năng này đang được phát triển, bạn hãy chờ Khiêm thêm một chút xíu nhé'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}