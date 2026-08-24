import re

with open('src/components/ProfileSection.tsx', 'r') as f:
    code = f.read()

# Replace getCroppedImg
old_get_cropped = re.search(r'const getCroppedImg.*?};', code, re.DOTALL)
if old_get_cropped:
    new_get_cropped = """const getCroppedImg = (imageSrc: string, pixelCrop: any): Promise<string> => {
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
  };"""
    code = re.sub(r'const getCroppedImg.*?\n  };\n', new_get_cropped + '\n', code, flags=re.DOTALL)

# Replace handleCropComplete
old_handle_crop = re.search(r'const handleCropComplete = async.*?};', code, re.DOTALL)
if old_handle_crop:
    new_handle_crop = """const handleCropComplete = async (croppedAreaPixels: any) => {
    setIsCropping(false);
    if (!selectedImage || !user) return;
    
    setLoading(true);
    try {
      const croppedBase64 = await getCroppedImg(selectedImage, croppedAreaPixels);
      
      if (!croppedBase64) {
        throw new Error('Generated base64 is empty');
      }
      
      await updateProfile(user, { photoURL: croppedBase64 });
      await syncFirebase.updateProfile({ avatarUrl: croppedBase64, avatarType: 'base64' });
      await refreshUser();
      
      setSuccess(t('profile.savedSuccessfully') || 'Saved Successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating avatar:', err);
      setError(t('profile.uploadFailed') || 'Upload Failed');
    } finally {
      setLoading(false);
      setSelectedImage(null);
    }
  };"""
    code = re.sub(r'const handleCropComplete = async.*?}\n  };\n', new_handle_crop + '\n', code, flags=re.DOTALL)

with open('src/components/ProfileSection.tsx', 'w') as f:
    f.write(code)

