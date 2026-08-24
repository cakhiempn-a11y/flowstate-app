import React, { useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Trash2, User } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { Mascot } from './Mascot';

interface AvatarPopoverProps {
  onClose: () => void;
  onUploadClick: () => void;
  onRemoveClick: () => void;
  onDefaultSelect: (url: string) => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
  hasPhoto: boolean;
}

export const AvatarPopover: React.FC<AvatarPopoverProps> = ({
  onClose,
  onUploadClick,
  onRemoveClick,
  onDefaultSelect,
  buttonRef,
  hasPhoto
}) => {
  const { t } = useTranslation();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, buttonRef]);

  const defaultAvatars = [
    { id: 'default-1', url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Felix&backgroundColor=f8bbd0' },
    { id: 'default-2', url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Aneka&backgroundColor=b2ebf2' },
    { id: 'default-3', url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Oliver&backgroundColor=c8e6c9' },
    { id: 'default-4', url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Zoey&backgroundColor=ffcc80' }
  ];

  return (
    <div
      ref={popoverRef}
      className="absolute z-40 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      style={{ left: 0, top: '100%' }}
    >
      <div className="p-2 space-y-1">
        <button
          onClick={() => { onUploadClick(); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors text-left"
        >
          {hasPhoto ? <ImageIcon className="w-4 h-4 text-primary" /> : <Upload className="w-4 h-4 text-primary" />}
          {hasPhoto ? (t('profile.changePhoto') || 'Change Photo') : (t('profile.uploadPhoto') || 'Upload Photo')}
        </button>
        
        {hasPhoto && (
          <button
            onClick={() => { onRemoveClick(); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-red-50 text-red-600 hover:text-red-700 dark:hover:bg-red-950/30 dark:text-red-400 rounded-lg transition-colors text-left"
          >
            <Trash2 className="w-4 h-4" />
            {t('profile.removePhoto') || 'Remove Photo'}
          </button>
        )}
      </div>
      
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t('profile.chooseDefaultAvatar') || 'Choose Default Avatar'}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {defaultAvatars.map(av => (
            <button
              key={av.id}
              onClick={() => { onDefaultSelect(av.url); onClose(); }}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Select default avatar"
            >
              <img src={av.url} alt="Default Avatar" className="w-full h-full object-cover" />
            </button>
          ))}
          <button
              onClick={() => { onDefaultSelect(''); onClose(); }}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-all focus:outline-none flex items-center justify-center bg-background"
              aria-label="Default App Mascot"
            >
              <Mascot className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
