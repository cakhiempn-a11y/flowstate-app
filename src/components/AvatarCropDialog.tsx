import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

interface AvatarCropDialogProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedAreaPixels: any) => void;
}

export const AvatarCropDialog: React.FC<AvatarCropDialogProps> = ({ imageSrc, onClose, onCropComplete }) => {
  const { t } = useTranslation();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = () => {
    onCropComplete(croppedAreaPixels);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-bold">{t('profile.crop') || 'Crop'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative w-full h-80 bg-black/10">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="p-4 space-y-4">
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-primary"
          />
          
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 font-semibold text-sm rounded-xl hover:bg-muted transition-colors"
            >
              {t('profile.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {t('profile.confirm') || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
