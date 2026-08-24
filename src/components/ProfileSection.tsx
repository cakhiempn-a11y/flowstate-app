import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { syncFirebase } from '../firebaseHelpers';
import { updateProfile } from 'firebase/auth';
import { ref, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { Shield, Mail, Loader2, Save } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { Mascot } from './Mascot';
import { AvatarPopover } from './AvatarPopover';
import { AvatarCropDialog } from './AvatarCropDialog';
import { Select } from './ui';

export const ProfileSection: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const profile = useStore(s => s.profile);
  const updateProfileState = useStore(s => s.updateProfileState);
  const { t } = useTranslation();
  
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    birthYear: '',
    gender: '',
    occupation: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const isGoogleAuth = user?.providerData?.some(p => p.providerId === 'google.com');
  const authProvider = isGoogleAuth ? t('settings.google') || 'Google' : t('settings.emailPassword') || 'Email/Password';

  const [isAvatarPopoverOpen, setIsAvatarPopoverOpen] = useState(false);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch extended profile data from users/{uid}
    const loadProfileData = async () => {
      if (user) {
        const data = await syncFirebase.fetchAllUserData();
        if (data && data.profile) {
          setProfileData(prev => ({
            ...prev,
            birthYear: data.profile.birthYear || '',
            gender: data.profile.gender || '',
            occupation: data.profile.occupation || ''
          }));
        }
      }
    };
    loadProfileData();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await updateProfile(user, { displayName: profileData.displayName });
      await syncFirebase.updateProfile({ 
        displayName: profileData.displayName,
        birthYear: profileData.birthYear,
        gender: profileData.gender,
        occupation: profileData.occupation
      });
      await refreshUser();
      console.log("[AVATAR DEBUG] N. local avatar state updated");
      setSuccess(t('profile.savedSuccessfully') || 'Saved Successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Update Profile Error:', err);
      setError(t('profile.saveFailed') || 'Operation failed');
    } finally {
      console.log("[AVATAR DEBUG] finally block entered, setting loading to false");
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setError(t('profile.invalidFileType') || 'Invalid File Type');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError(t('profile.fileTooLarge') || 'File Too Large (Max 5MB)');
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setIsCropping(true);
      };
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getCroppedImg = (imageSrc: string, pixelCrop: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!pixelCrop) return reject(new Error('No crop area selected'));
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 128;
          canvas.height = 128;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('No 2d context'));
          ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            128,
            128
          );
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        } catch (e) {
          reject(e);
        }
      };
      image.onerror = (error) => reject(error);
    });
  };

  const handleCropComplete = async (croppedAreaPixels: any) => {
    setIsCropping(false);
    if (!selectedImage || !user) return;
    
    setLoading(true);
    try {
      const croppedBase64 = await getCroppedImg(selectedImage, croppedAreaPixels);
      
      if (!croppedBase64) {
        throw new Error('Generated base64 is empty');
      }
      
      
      await syncFirebase.updateProfile({ avatarUrl: croppedBase64, avatarType: 'base64' });
      updateProfileState({ avatarUrl: croppedBase64, avatarType: 'base64' });
      
      setSuccess(t('profile.savedSuccessfully') || 'Saved Successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating avatar:', err);
      setError(t('profile.uploadFailed') || 'Upload Failed');
    } finally {
      setLoading(false);
      setSelectedImage(null);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.photoURL && user.photoURL.includes('firebasestorage')) {
        console.log("[AVATAR DEBUG] creating storage ref");
      const avatarRef = ref(storage, `users/${user.uid}/profile/avatar.jpg`);
        try {
          const deleteTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('delete timeout')), 5000));
          await Promise.race([deleteObject(avatarRef), deleteTimeout]);
        } catch(e) {
          // ignore if it doesn't exist
        }
      }
      
      await syncFirebase.updateProfile({ avatarUrl: '', avatarType: '' });
      updateProfileState({ avatarUrl: '', avatarType: '' });
      setSuccess(t('profile.savedSuccessfully') || 'Saved Successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(t('profile.saveFailed') || 'Operation failed');
    } finally {
      console.log("[AVATAR DEBUG] finally block entered, setting loading to false");
      setLoading(false);
    }
  };

  const handleDefaultSelect = async (url: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile(user, { photoURL: url });
      await syncFirebase.updateProfile({ avatarUrl: url, avatarType: 'url' });
      updateProfileState({ avatarUrl: url, avatarType: 'url' });
      await refreshUser();
      setSuccess(t('profile.savedSuccessfully') || 'Saved Successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(t('profile.saveFailed') || 'Operation failed');
    } finally {
      console.log("[AVATAR DEBUG] finally block entered, setting loading to false");
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <UserIcon className="w-5 h-5 text-primary" />
        {t('profile.profileSettings') || 'Profile'}
      </h3>
      
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
      {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">{success}</div>}
      
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 relative">
        <div className="relative">
          <button
            ref={avatarButtonRef}
            type="button"
            onClick={() => setIsAvatarPopoverOpen(!isAvatarPopoverOpen)}
            className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border-2 border-primary/20 shrink-0 hover:border-primary transition-all focus:outline-none focus:ring-4 focus:ring-primary/20 group cursor-pointer"
            aria-label="Change profile photo"
          >
            {(profile?.avatarUrl || user?.photoURL) ? (
              <img src={profile?.avatarUrl || user?.photoURL} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
            ) : (
              <div className="group-hover:opacity-80 transition-opacity">
                <Mascot className="w-16 h-16" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <span className="text-white text-xs font-bold">{t('profile.changePhoto') || 'Change'}</span>
            </div>
          </button>
          
          {isAvatarPopoverOpen && (
            <AvatarPopover
              hasPhoto={!!(profile?.avatarUrl || user?.photoURL)}
              onClose={() => setIsAvatarPopoverOpen(false)}
              onUploadClick={() => fileInputRef.current?.click()}
              onRemoveClick={handleRemovePhoto}
              onDefaultSelect={handleDefaultSelect}
              buttonRef={avatarButtonRef}
            />
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg, image/png, image/webp, image/jpg"
            className="hidden"
          />
        </div>
        
        <div className="flex-1 space-y-1 text-center sm:text-left w-full">
          <div className="font-bold text-2xl truncate">{user?.displayName || 'User'}</div>
          <div className="text-sm font-medium text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
            <Mail className="w-4 h-4" />
            <span className="truncate">{user?.email}</span>
          </div>
          <div className="text-xs font-semibold px-2 py-1 bg-muted text-muted-foreground rounded-md inline-flex items-center gap-1 mt-2">
            <Shield className="w-3 h-3" />
            {authProvider}
          </div>
        </div>
      </div>
      
      <form onSubmit={handleUpdateProfile} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {t('login.displayName') || 'Display Name'}
            </label>
            <input
              type="text"
              value={profileData.displayName}
              onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
              className="w-full bg-muted/50 border-2 border-transparent focus:border-primary rounded-xl px-4 py-3 text-sm transition-all outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {t('profile.occupation') || 'Occupation'}
            </label>
            <input
              type="text"
              value={profileData.occupation}
              onChange={(e) => setProfileData({...profileData, occupation: e.target.value})}
              placeholder="e.g. Designer, Student..."
              className="w-full bg-muted/50 border-2 border-transparent focus:border-primary rounded-xl px-4 py-3 text-sm transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {t('profile.birthYear') || 'Birth Year'}
            </label>
            <Select
              value={profileData.birthYear}
              onChange={(value) => setProfileData({...profileData, birthYear: String(value)})}
              options={[
                { value: "", label: "--" },
                ...years.map(y => ({ value: y.toString(), label: y.toString() }))
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {t('profile.gender') || 'Gender'}
            </label>
            <Select
              value={profileData.gender}
              onChange={(value) => setProfileData({...profileData, gender: String(value)})}
              options={[
                { value: "", label: "--" },
                { value: "Male", label: t('profile.male') || 'Male' },
                { value: "Female", label: t('profile.female') || 'Female' },
                { value: "Non-binary", label: t('profile.nonBinary') || 'Non-binary' },
                { value: "Other", label: t('profile.other') || 'Other' },
                { value: "Prefer not to say", label: t('profile.preferNotToSay') || 'Prefer not to say' }
              ]}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow-sm hover:bg-primary/90 flex items-center justify-center min-w-[140px] transition-all gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('profile.saveChanges') || 'Save Changes'}
          </button>
        </div>
      </form>

      {isCropping && selectedImage && (
        <AvatarCropDialog
          imageSrc={selectedImage}
          onClose={() => { setIsCropping(false); setSelectedImage(null); }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
