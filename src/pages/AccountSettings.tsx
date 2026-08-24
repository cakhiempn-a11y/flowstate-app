import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { syncFirebase } from '../firebaseHelpers';
import { auth } from '../firebase';
import { updateProfile, updatePassword, signOut, deleteUser, EmailAuthProvider, reauthenticateWithCredential, linkWithCredential, GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
import { LogOut, Loader2, Key, Shield, Trash2, Mail, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { Mascot } from '../components/Mascot';
import { ProfileSection } from '../components/ProfileSection';
import { SpecialFeaturesSettings } from '../components/SpecialFeaturesSettings';

export const AccountSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  
  
  const [deleteLoading, setDeleteLoading] = useState(false);
  const isGoogleAuth = user?.providerData?.some(p => p.providerId === 'google.com');
  const hasPasswordProvider = user?.providerData?.some(p => p.providerId === 'password');
  const showPasswordForm = hasPasswordProvider || !isGoogleAuth;
  const authProvider = isGoogleAuth ? t('settings.google') : t('settings.emailPassword');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  
  // Clear password state on unmount
  useEffect(() => {
    return () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwdError('');
      setPwdSuccess('');
    };
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setPwdError('');
    setPwdSuccess('');
    
    if (!showPasswordForm) {
      // Setting password for the first time for Google users
      if (!newPassword || !confirmPassword) {
        setPwdError(t('settings.emptyFields') || 'Please fill in all fields');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setPwdError(t('settings.passwordMismatch') || 'Passwords do not match');
        return;
      }
      
      if (newPassword.length < 6) {
        setPwdError(t('settings.passwordTooWeak') || 'Password must be at least 6 characters');
        return;
      }
      
      setPwdLoading(true);
      try {
        const credential = EmailAuthProvider.credential(user.email!, newPassword);
        try {
          await linkWithCredential(user, credential);
        } catch (linkError: any) {
          if (linkError.code === 'auth/requires-recent-login') {
            const provider = new GoogleAuthProvider();
            await reauthenticateWithPopup(user, provider);
            await linkWithCredential(user, credential);
          } else {
            throw linkError;
          }
        }
        setPwdSuccess(t('settings.emailLinkedMsg') || 'Your FlowState password has been set. You can now sign in with email/password or Google.');
        setNewPassword('');
        setConfirmPassword('');
        refreshUser();
      } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/email-already-in-use' || err.code === 'auth/credential-already-in-use') {
          setPwdError(t('settings.emailInUse') || 'This email is already associated with another account.');
        } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
          setPwdError('Authentication cancelled.');
        } else if (err.code === 'auth/network-request-failed') {
          setPwdError(t('auth.networkError') || 'Network error. Please check your connection.');
        } else {
          setPwdError(err.message);
        }
      } finally {
        setPwdLoading(false);
      }
      return;
    }
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError(t('settings.emptyFields') || 'Please fill in all fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPwdError(t('settings.passwordMismatch') || 'Passwords do not match');
      return;
    }
    
    if (newPassword === currentPassword) {
      setPwdError(t('settings.passwordSame') || 'New password must be different from current password.');
      return;
    }

    if (newPassword.length < 6) {
      setPwdError(t('settings.passwordTooWeak') || 'Password must be at least 6 characters');
      return;
    }
    
    setPwdLoading(true);
    
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      setPwdSuccess(t('settings.changePasswordSuccess') || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setPwdError(t('auth.incorrectPassword') || 'Incorrect current password');
      } else if (err.code === 'auth/requires-recent-login') {
        setPwdError(t('settings.requiresRecentLogin') || 'Requires recent login. Please log out and back in.');
      } else if (err.code === 'auth/weak-password') {
        setPwdError(t('settings.passwordTooWeak') || 'Password is too weak');
      } else if (err.code === 'auth/network-request-failed') {
        setPwdError(t('auth.networkError') || 'Network error. Please check your connection.');
      } else if (err.code === 'auth/too-many-requests') {
        setPwdError(t('auth.tooManyRequests') || 'Too many requests. Try again later.');
      } else {
        setPwdError(err.message);
      }
    } finally {
      setPwdLoading(false);
    }
  };

  const clearStoreForLogout = useStore(s => s.clearStoreForLogout);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      clearStoreForLogout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (window.confirm(t('messages.resetAppConfirm1') || 'Are you sure you want to delete your account? This cannot be undone.')) {
      setDeleteLoading(true);
      try {
        await deleteUser(user);
        window.location.href = '/login';
      } catch (err: any) {
        if (err.code === 'auth/requires-recent-login') {
          alert('This action requires a recent login. Please log out and log back in, then try again.');
        } else {
          alert(err.message);
        }
        setDeleteLoading(false);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <ProfileSection />
      
      {/* Change Password Section */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          {showPasswordForm ? (t('settings.changePassword') || 'Change Password') : (t('settings.setPasswordTitle') || 'Set Password')}
        </h3>
        
        {!showPasswordForm ? (
          <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
            <div className="px-4 py-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-sm font-medium text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3 mb-4">
              <Shield className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{t('settings.googleLoginMsg') || 'Your account is logged in with Google. You can set a FlowState password to log in with email and password in the future.'}</p>
            </div>
            
            {pwdError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{pwdError}</div>}
            {pwdSuccess && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">{pwdSuccess}</div>}
            
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                {t('settings.email') || 'Email'}
              </label>
              <input
                type="text"
                value={user?.email || ''}
                readOnly
                className="w-full bg-muted/50 border-2 border-transparent rounded-xl px-4 py-3 text-sm outline-none opacity-70 cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                {t('settings.newPassword') || 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-muted/50 border-2 border-transparent focus:border-primary rounded-xl px-4 py-3 text-sm transition-all outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('settings.passwordTooWeak') || 'Password must be at least 6 characters'}
              </p>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                {t('settings.confirmNewPassword') || 'Confirm New Password'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-muted/50 border-2 border-transparent focus:border-primary rounded-xl px-4 py-3 text-sm transition-all outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={pwdLoading}
                className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow-sm hover:bg-primary/90 flex items-center justify-center min-w-[140px] transition-all"
              >
                {pwdLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (t('settings.setPasswordBtn') || 'Set Password')}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
            {pwdError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{pwdError}</div>}
            {pwdSuccess && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">{pwdSuccess}</div>}
            
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                {t('settings.currentPassword') || 'Current Password'}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-muted/50 border-2 border-transparent focus:border-primary rounded-xl px-4 py-3 text-sm transition-all outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                {t('settings.newPassword') || 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-muted/50 border-2 border-transparent focus:border-primary rounded-xl px-4 py-3 text-sm transition-all outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('settings.passwordTooWeak') || 'Password must be at least 6 characters'}
              </p>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                {t('settings.confirmNewPassword') || 'Confirm New Password'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-muted/50 border-2 border-transparent focus:border-primary rounded-xl px-4 py-3 text-sm transition-all outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={pwdLoading}
                className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow-sm hover:bg-primary/90 flex items-center justify-center min-w-[140px] transition-all"
              >
                {pwdLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (t('settings.changePassword') || 'Change Password')}
              </button>
            </div>
          </form>
        )}
      </div>
      
      <SpecialFeaturesSettings />
      
      {/* Login & Security / Logout */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-500" />
          {t('settings.security')}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Manage your session and log out of this device.
        </p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t('settings.logout')}
        </button>
      </div>
      
      {/* Account Management */}
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-2 text-red-700 dark:text-red-400 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          {t('settings.deleteAccount')}
        </h3>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 font-medium mb-4">
          Permanently delete your account and all associated data. This action cannot be reversed.
        </p>
        
        <button
          onClick={handleDeleteAccount}
          disabled={deleteLoading}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {t('settings.deleteAccount')}
        </button>
      </div>
      
    </div>
  );
};

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
