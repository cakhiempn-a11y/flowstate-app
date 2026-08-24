import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { Shield, Lock, Unlock, Loader2, Eye, EyeOff } from 'lucide-react';
import { hashPin } from '../lib/pinUtils';
import { useAuth } from '../contexts/AuthContext';
import { syncFirebase } from '../firebaseHelpers';

export function SpecialFeaturesSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const profile = useStore(state => state.profile);
  const updateProfileState = useStore(state => state.updateProfileState);
  
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'view' | 'setup' | 'change' | 'disable'>('view');
  
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isSet = !!profile?.specialFeaturesPinHash && profile?.specialFeaturesPinEnabled;

  const validatePin = (pin: string) => /^\d{4,6}$/.test(pin);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validatePin(newPin)) {
      setError(t('specialFeatures.pinLengthError') || 'PIN must contain 4-6 digits.');
      return;
    }
    
    if (newPin !== confirmPin) {
      setError(t('specialFeatures.pinMatchError') || 'The PINs do not match.');
      return;
    }
    
    if (!user) return;
    
    setLoading(true);
    try {
      const hashed = await hashPin(newPin, user.uid);
      const updates = { specialFeaturesPinHash: hashed, specialFeaturesPinEnabled: true };
      await syncFirebase.updateProfile(updates);
      updateProfileState(updates);
      setMode('view');
      resetForms();
    } catch (err) {
      setError('Failed to setup PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!user || !profile?.specialFeaturesPinHash) return;
    
    const hashedCurrent = await hashPin(currentPin, user.uid);
    if (hashedCurrent !== profile.specialFeaturesPinHash) {
      setError(t('specialFeatures.incorrectPin') || 'Incorrect PIN.');
      return;
    }
    
    if (!validatePin(newPin)) {
      setError(t('specialFeatures.pinLengthError') || 'PIN must contain 4-6 digits.');
      return;
    }
    
    if (newPin !== confirmPin) {
      setError(t('specialFeatures.pinMatchError') || 'The PINs do not match.');
      return;
    }
    
    setLoading(true);
    try {
      const hashedNew = await hashPin(newPin, user.uid);
      const updates = { specialFeaturesPinHash: hashedNew, specialFeaturesPinEnabled: true };
      await syncFirebase.updateProfile(updates);
      updateProfileState(updates);
      
      // Lock on change
      useStore.getState().setSpecialFeaturesUnlocked(false);
      
      setMode('view');
      resetForms();
    } catch (err) {
      setError('Failed to change PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!user || !profile?.specialFeaturesPinHash) return;
    
    const hashedCurrent = await hashPin(currentPin, user.uid);
    if (hashedCurrent !== profile.specialFeaturesPinHash) {
      setError(t('specialFeatures.incorrectPin') || 'Incorrect PIN.');
      return;
    }
    
    setLoading(true);
    try {
      const updates = { specialFeaturesPinEnabled: false };
      await syncFirebase.updateProfile(updates);
      updateProfileState(updates);
      useStore.getState().setSpecialFeaturesUnlocked(false);
      setMode('view');
      resetForms();
    } catch (err) {
      setError('Failed to disable PIN');
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const renderInput = (
    label: string, 
    value: string, 
    setValue: (v: string) => void, 
    show: boolean, 
    setShow: (v: boolean) => void
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
          className="w-full bg-muted/50 border-2 border-transparent focus:border-primary rounded-xl px-4 py-3 text-sm transition-all outline-none pr-12"
          placeholder="••••••"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-8">
      <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-pink-600 dark:text-pink-400">
        <HeartLockIcon className="w-5 h-5" />
        {t('specialFeatures.securityTitle') || 'Private Space Security'}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {t('specialFeatures.securityDesc') || 'This PIN is used only to unlock Private Space and is separate from your login password.'}
      </p>

      {mode === 'view' && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-full ${isSet ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              {isSet ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {isSet ? (t('specialFeatures.pinIsSet') || 'PIN is set') : (t('specialFeatures.pinNotSet') || 'PIN not set')}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {!isSet ? (
              <button
                onClick={() => { resetForms(); setMode('setup'); }}
                className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-sm transition-colors"
              >
                {t('specialFeatures.setUpPin') || 'Set up PIN'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => { resetForms(); setMode('change'); }}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-sm transition-colors"
                >
                  {t('specialFeatures.changePin') || 'Change PIN'}
                </button>
                <button
                  onClick={() => { resetForms(); setMode('disable'); }}
                  className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl text-sm transition-colors"
                >
                  {t('specialFeatures.disablePin') || 'Disable PIN'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {mode === 'setup' && (
        <form onSubmit={handleSetup} className="max-w-md">
          {error && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
          
          {renderInput(t('specialFeatures.newPin') || 'New PIN', newPin, setNewPin, showNew, setShowNew)}
          {renderInput(t('specialFeatures.confirmNewPin') || 'Confirm New PIN', confirmPin, setConfirmPin, showConfirm, setShowConfirm)}
          
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-pink-600 text-white font-bold rounded-xl text-sm flex items-center justify-center min-w-[120px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (t('specialFeatures.setUpPin') || 'Set up PIN')}
            </button>
            <button
              type="button"
              onClick={() => setMode('view')}
              disabled={loading}
              className="px-6 py-2.5 bg-muted text-foreground font-bold rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === 'change' && (
        <form onSubmit={handleChange} className="max-w-md">
          {error && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
          
          {renderInput(t('specialFeatures.currentPin') || 'Current PIN', currentPin, setCurrentPin, showCurrent, setShowCurrent)}
          {renderInput(t('specialFeatures.newPin') || 'New PIN', newPin, setNewPin, showNew, setShowNew)}
          {renderInput(t('specialFeatures.confirmNewPin') || 'Confirm New PIN', confirmPin, setConfirmPin, showConfirm, setShowConfirm)}
          
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm flex items-center justify-center min-w-[120px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (t('specialFeatures.changePin') || 'Change PIN')}
            </button>
            <button
              type="button"
              onClick={() => setMode('view')}
              disabled={loading}
              className="px-6 py-2.5 bg-muted text-foreground font-bold rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === 'disable' && (
        <form onSubmit={handleDisable} className="max-w-md">
          {error && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
          
          <p className="text-sm font-medium text-foreground mb-4">
            Please enter your current PIN to disable Private Space protection.
          </p>
          
          {renderInput(t('specialFeatures.currentPin') || 'Current PIN', currentPin, setCurrentPin, showCurrent, setShowCurrent)}
          
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm flex items-center justify-center min-w-[120px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (t('specialFeatures.disablePin') || 'Disable PIN')}
            </button>
            <button
              type="button"
              onClick={() => setMode('view')}
              disabled={loading}
              className="px-6 py-2.5 bg-muted text-foreground font-bold rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => {
                const lastSignIn = new Date(user?.metadata.lastSignInTime || 0).getTime();
                const now = Date.now();
                if (now - lastSignIn < 5 * 60 * 1000) {
                  if (window.confirm('Reset your Private Space PIN?')) {
                    syncFirebase.updateProfile({ specialFeaturesPinEnabled: false, specialFeaturesPinHash: '' })
                      .then(() => {
                        updateProfileState({ specialFeaturesPinEnabled: false, specialFeaturesPinHash: '' });
                        setMode('view');
                      });
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
        </form>
      )}
    </div>
  );
}

const HeartLockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    <rect width="8" height="6" x="8" y="11" rx="1" />
    <path d="M12 11v2" />
  </svg>
);
