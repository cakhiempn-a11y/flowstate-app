const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileSection.tsx', 'utf8');

code = code.replace(/const handleCropComplete = async \(croppedAreaPixels: any\) => \{[\s\S]*?setIsCropping\(false\);/, `const handleCropComplete = async (croppedAreaPixels: any) => {
    console.log("[AVATAR DEBUG] A. crop confirmed");
    setIsCropping(false);`);

code = code.replace(/const croppedBlob = await getCroppedImg\(selectedImage, croppedAreaPixels\);/, `const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      console.log("[AVATAR DEBUG] B. cropped image generated");
      console.log("[AVATAR DEBUG] C. blob created");
      console.log("[AVATAR DEBUG] D. blob size:", croppedBlob?.size);
      console.log("[AVATAR DEBUG] E. blob MIME type:", croppedBlob?.type);
      console.log("[AVATAR DEBUG] F. current Firebase UID:", user.uid);`);

code = code.replace(/const avatarRef = ref\(storage, \`users\/\$\{user\.uid\}\/profile\/avatar\.jpg\`\);/, `const avatarRef = ref(storage, \`users/\${user.uid}/profile/avatar.jpg\`);
      console.log("[AVATAR DEBUG] G. Storage reference path:", avatarRef.fullPath);`);

code = code.replace(/const uploadTask = uploadBytes\(avatarRef, croppedBlob\);[\s\S]*?await Promise\.race\(\[uploadTask, timeoutTask\]\);/, `console.log("[AVATAR DEBUG] H. upload started");
      const uploadTask = uploadBytes(avatarRef, croppedBlob);
      const timeoutTask = new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timeout after 15s')), 15000));
      await Promise.race([uploadTask, timeoutTask]);
      console.log("[AVATAR DEBUG] I. upload succeeded");`);

code = code.replace(/const downloadURL = await getDownloadURL\(avatarRef\);/, `console.log("[AVATAR DEBUG] J. getDownloadURL started");
      const downloadURL = await getDownloadURL(avatarRef);
      console.log("[AVATAR DEBUG] K. getDownloadURL succeeded. URL:", downloadURL.substring(0, 50) + '...');`);

code = code.replace(/await syncFirebase\.updateProfile\(\{ avatarUrl: downloadURL, avatarType: 'storage' \}\);/, `console.log("[AVATAR DEBUG] L. Firestore avatar update started");
      await syncFirebase.updateProfile({ avatarUrl: downloadURL, avatarType: 'storage' });
      console.log("[AVATAR DEBUG] M. Firestore avatar update succeeded");`);

code = code.replace(/await refreshUser\(\);/, `await refreshUser();
      console.log("[AVATAR DEBUG] N. local avatar state updated");`);

code = code.replace(/setLoading\(false\);\n      setSelectedImage\(null\);/, `setLoading(false);
      setSelectedImage(null);
      console.log("[AVATAR DEBUG] O. final cleanup executed");`);

code = code.replace(/setError\(t\('profile\.uploadFailed'\) \|\| 'Upload Failed'\);/, `setError(t('profile.uploadFailed') || 'Upload Failed');
      console.log("[AVATAR DEBUG] I/K/M. Upload/Download/Firestore failed");`);

fs.writeFileSync('src/components/ProfileSection.tsx', code);
