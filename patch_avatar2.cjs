const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileSection.tsx', 'utf8');

code = code.replace(/const getCroppedImg = \(imageSrc: string, pixelCrop: any\): Promise<Blob> => \{[\s\S]*?canvas\.toBlob\(\(blob\) => \{[\s\S]*?resolve\(blob\);[\s\S]*?\}, 'image\/jpeg', 0\.9\);[\s\S]*?\} catch \(e\) \{[\s\S]*?reject\(e\);[\s\S]*?\}[\s\S]*?\};[\s\S]*?image\.onerror = \(error\) => reject\(error\);[\s\S]*?\}\);[\s\S]*?\};/m, `const getCroppedImg = (imageSrc: string, pixelCrop: any): Promise<string> => {
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
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        }
      };
      image.onerror = (error) => reject(error);
    });
  };`);

code = code.replace(/const handleCropComplete = async \(croppedAreaPixels: any\) => \{[\s\S]*?setLoading\(true\);[\s\S]*?try \{[\s\S]*?const croppedBlob = await getCroppedImg\(selectedImage, croppedAreaPixels\);[\s\S]*?const avatarRef = ref\(storage, \`users\/\$\{user\.uid\}\/profile\/avatar\.jpg\`\);[\s\S]*?await syncFirebase\.updateProfile\(\{ avatarUrl: downloadURL, avatarType: 'storage' \}\);[\s\S]*?await refreshUser\(\);[\s\S]*?console\.log\("\[AVATAR DEBUG\] N\. local avatar state updated"\);[\s\S]*?setSuccess\(t\('profile\.savedSuccessfully'\) \|\| 'Saved Successfully'\);[\s\S]*?\} catch \(err\) \{/m, `const handleCropComplete = async (croppedAreaPixels: any) => {
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
    } catch (err) {`);

fs.writeFileSync('src/components/ProfileSection.tsx', code);
