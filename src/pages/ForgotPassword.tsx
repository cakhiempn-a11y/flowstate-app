import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Loader2, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useStore } from '../store/useStore';

import { ClockLogo } from '../components/ClockLogo';

export const ForgotPassword = () => {
  const { user, loading } = useAuth();
    const theme = useStore(s => s.settings.theme);
  const { t } = useTranslation();
  
  const setSettings = useStore(s => s.updateSettings);

  const [email, setEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/invalid-email') setError(t('auth.invalidEmail'));
      else if (err.code === 'auth/user-not-found') setError(t('auth.userNotFound'));
      else setError(t('auth.unableToReset'));
    } finally {
      setAuthLoading(false);
    }
  };

  

  
  
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-background text-foreground font-sans relative">
      <div className="absolute top-6 left-6 flex justify-between items-center w-[calc(100%-3rem)]">
        <Link to="/login" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors font-bold text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>{t('login.back')}</span>
        </Link>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <ThemeSwitcher currentTheme={theme} onChange={(t: any) => setSettings({ theme: t })} />
        </div>
      </div>

      <div className="w-full max-w-md mx-auto flex flex-col items-center mb-8">
        <div className="flex items-center space-x-3 mb-8">
          <ClockLogo className="w-10 h-10" />
          <span className="font-black text-2xl tracking-tight text-foreground">FlowState</span>
        </div>

        <div className="w-full bg-card p-8 rounded-3xl shadow-xl border border-border">
          <h1 className="text-3xl font-bold mb-2 text-center">{t('login.resetPassword')}</h1>
          <p className="text-muted-foreground mb-8 text-sm text-center">
            {t('login.resetPasswordDesc')}
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="mb-6 p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-lg mb-1">{t('login.checkInbox')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('login.resetInstructions')} <span className="font-bold text-foreground">{email}</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  {t('login.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-muted/50 border-2 border-transparent focus:border-primary rounded-xl pl-11 pr-4 py-3 text-sm transition-all outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-xl shadow-sm hover:bg-primary/90 transition-all flex justify-center items-center h-12 mt-2"
              >
                {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('login.sendResetLink')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};


