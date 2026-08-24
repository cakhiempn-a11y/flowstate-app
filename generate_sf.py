import os

with open('src/pages/SpecialFeatures.tsx', 'w') as f:
    f.write('''import React, { useState, useEffect } from 'react';
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
      loadCycles();
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
      loadCycles();
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8" />
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
      <div className="max-w-4xl mx-auto space-y-8">
        
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

        {/* Menstrual Cycle Section */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              {t('specialFeatures.menstrualCycle') || 'Menstrual Cycle'}
            </h2>
            <button
              onClick={() => {
                setEditingCycle(null);
                setStartDate(format(new Date(), 'yyyy-MM-dd'));
                setEndDate('');
                setShowAddForm(!showAddForm);
              }}
              className="px-4 py-2 bg-pink-600 text-white font-bold rounded-xl text-sm hover:bg-pink-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('specialFeatures.addPeriod') || 'Add Period'}
            </button>
          </div>
          
          {showAddForm && (
            <div className="p-6 bg-pink-50/50 dark:bg-pink-950/10 border-b border-border animate-in fade-in slide-in-from-top-2">
              <form onSubmit={handleAddPeriod} className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    {t('specialFeatures.periodStartDate') || 'Period Start Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-background border-2 border-border focus:border-pink-500 rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    {t('specialFeatures.periodEndDate') || 'Period End Date'} (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full bg-background border-2 border-border focus:border-pink-500 rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>
                <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2.5 bg-muted text-foreground font-bold rounded-xl text-sm hover:bg-muted/80 transition-colors h-[46px]"
                    >
                      {t('specialFeatures.cancel') || 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-pink-600 text-white font-bold rounded-xl text-sm hover:bg-pink-700 transition-colors h-[46px] flex items-center justify-center min-w-[100px]"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (t('specialFeatures.save') || 'Save')}
                    </button>
                </div>
              </form>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Dashboard / Estimates */}
            <div className="p-6 col-span-1 bg-muted/20">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">
                {t('specialFeatures.estimated') || 'Estimated'}
              </h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    {t('specialFeatures.cycleLength') || 'Cycle Length'}
                  </p>
                  <div className="text-3xl font-black text-foreground">
                    {cycles.length >= 2 ? avgCycleLength : '--'} <span className="text-base font-medium text-muted-foreground">{t('specialFeatures.days') || 'days'}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    {t('specialFeatures.estimatedNextPeriod') || 'Estimated Next Period'}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        {estimatedNext ? format(estimatedNext, 'MMM d, yyyy') : '--'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    {t('specialFeatures.estimatedOvulation') || 'Estimated Ovulation Date'}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        {ovulationDate ? format(ovulationDate, 'MMM d, yyyy') : t('specialFeatures.notEnoughData') || 'Not enough data'}
                      </p>
                    </div>
                  </div>
                </div>

                {fertileWindowStart && fertileWindowEnd && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      {t('specialFeatures.estimatedFertileWindow') || 'Estimated Fertile Window'}
                    </p>
                    <p className="font-bold text-foreground text-sm">
                      {format(fertileWindowStart, 'MMM d')} - {format(fertileWindowEnd, 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium mt-4">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{t('specialFeatures.disclaimer') || 'This is only an estimate and is not a medically precise prediction.'}</p>
                </div>
              </div>
            </div>
            
            {/* History */}
            <div className="p-6 col-span-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">
                {t('specialFeatures.cycleHistory') || 'Cycle History'}
              </h3>
              
              {fetchingData ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                </div>
              ) : cycles.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  <p className="mb-4">{t('specialFeatures.noCycleHistory') || 'No cycle history yet'}</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 font-bold rounded-xl text-sm hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
                  >
                    {t('specialFeatures.addPeriod') || '+ Add Period'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cycles.map((cycle, i) => {
                    const prevCycle = cycles[i+1];
                    let cLength: number | null = null;
                    if (prevCycle) {
                      cLength = differenceInDays(parseISO(cycle.startDate), parseISO(prevCycle.startDate));
                    }
                    
                    return (
                      <div key={cycle.id} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl group relative overflow-hidden">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-10 bg-pink-500 rounded-full" />
                          <div>
                            <p className="font-bold text-foreground">
                              {format(parseISO(cycle.startDate), 'MMM d, yyyy')}
                              {cycle.endDate && ` - ${format(parseISO(cycle.endDate), 'MMM d, yyyy')}`}
                            </p>
                            {cycle.duration && (
                              <p className="text-sm text-muted-foreground">{cycle.duration} {t('specialFeatures.days') || 'days'}</p>
                            )}
                            
                            <div className="flex gap-3 mt-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEditCycle(cycle)}
                                className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                              >
                                <Edit2 className="w-3 h-3" /> {t('specialFeatures.edit') || 'Edit'}
                              </button>
                              <button 
                                onClick={() => setShowDeleteConfirm(cycle.id)}
                                className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 hover:underline"
                              >
                                <Trash2 className="w-3 h-3" /> {t('specialFeatures.delete') || 'Delete'}
                              </button>
                            </div>
                          </div>
                        </div>
                        {cLength && cLength > 0 && (
                          <div className="text-right">
                            <p className="font-bold text-foreground">{cLength}</p>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t('specialFeatures.dayCycle') || 'Day Cycle'}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Partner Reminders Section */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mt-8">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              {t('specialFeatures.partnerReminders') || 'Partner Reminders'}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {t('specialFeatures.sharingWarning') || 'You can create reminders for your partner, but your cycle data will not be shared unless you explicitly enable it.'}
            </p>
          </div>
          <div className="p-6 space-y-6">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={partnerReminders.enabled}
                  onChange={(e) => {
                    const newVal = { ...partnerReminders, enabled: e.target.checked };
                    setPartnerReminders(newVal);
                    syncFirebase.updateProfile({ partnerReminders: newVal });
                  }}
                />
                <div className={cn("block w-10 h-6 rounded-full transition-colors", partnerReminders.enabled ? "bg-pink-500" : "bg-muted")}></div>
                <div className={cn("absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform", partnerReminders.enabled ? "translate-x-4" : "")}></div>
              </div>
              <span className="text-sm font-bold text-foreground">{t('specialFeatures.allowSharing') || 'Allow cycle information sharing with partner'}</span>
            </label>
            
            {partnerReminders.enabled && (
              <div className="space-y-6 pl-4 md:pl-6 border-l-2 border-border animate-in fade-in slide-in-from-top-2">
                 
                 <div className="space-y-3">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t('specialFeatures.sharePermissions') || 'Share Permissions'}</p>
                    {[
                      { key: 'shareNextPeriod', label: t('specialFeatures.shareNextPeriod') || 'Share next expected period' },
                      { key: 'shareCurrentStatus', label: t('specialFeatures.shareCurrentStatus') || 'Share current period status' },
                      { key: 'shareOvulation', label: t('specialFeatures.shareOvulation') || 'Share estimated ovulation date' },
                      { key: 'shareFertileWindow', label: t('specialFeatures.shareFertileWindow') || 'Share estimated fertile window' }
                    ].map(perm => (
                      <label key={perm.key} className="flex items-center gap-3 cursor-pointer w-fit select-none">
                        <input 
                          type="checkbox" 
                          checked={partnerReminders[perm.key as keyof typeof partnerReminders] as boolean}
                          onChange={(e) => {
                            const newVal = { ...partnerReminders, [perm.key]: e.target.checked };
                            setPartnerReminders(newVal);
                            syncFirebase.updateProfile({ partnerReminders: newVal });
                          }}
                          className="w-5 h-5 rounded text-pink-600 focus:ring-pink-500 bg-background border-2 border-border"
                        />
                        <span className="text-sm text-foreground">{perm.label}</span>
                      </label>
                    ))}
                 </div>

                 <div className="space-y-3 pt-2">
                    <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      {t('specialFeatures.customMessage') || 'Custom Message'}
                    </label>
                    <input 
                      type="text"
                      value={partnerReminders.customMessage}
                      onChange={(e) => setPartnerReminders({ ...partnerReminders, customMessage: e.target.value })}
                      onBlur={() => syncFirebase.updateProfile({ partnerReminders })}
                      placeholder={t('specialFeatures.customMessagePlaceholder') || 'e.g. Please bring some chocolate!'}
                      className="w-full bg-background border-2 border-border focus:border-pink-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                    />
                 </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-foreground mb-2">{t('specialFeatures.delete') || 'Delete'}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('specialFeatures.deleteConfirm') || 'Are you sure you want to delete this period record?'}
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleteLoading}
                className="px-4 py-2 bg-muted text-foreground font-bold rounded-xl text-sm hover:bg-muted/80 transition-colors"
              >
                {t('specialFeatures.cancel') || 'Cancel'}
              </button>
              <button 
                onClick={handleDeleteCycle}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t('specialFeatures.delete') || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'''
    )

