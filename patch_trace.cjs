const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileSection.tsx', 'utf8');

code = code.replace(/const handleCropComplete = async \(croppedAreaPixels: any\) => {/, `const handleCropComplete = async (croppedAreaPixels: any) => {
    console.log("handleCropComplete started");`);

code = code.replace(/const croppedImageBase64 = await getCroppedImg\(selectedImage, croppedAreaPixels\);/, `console.log("awaiting getCroppedImg");
      const croppedImageBase64 = await getCroppedImg(selectedImage, croppedAreaPixels);
      console.log("getCroppedImg done");`);

code = code.replace(/await uploadString\(avatarRef, croppedImageBase64, 'data_url'\);/, `console.log("awaiting uploadString");
      await uploadString(avatarRef, croppedImageBase64, 'data_url');
      console.log("uploadString done");`);

code = code.replace(/const downloadURL = await getDownloadURL\(avatarRef\);/, `console.log("awaiting getDownloadURL");
      const downloadURL = await getDownloadURL(avatarRef);
      console.log("getDownloadURL done: " + downloadURL);`);

code = code.replace(/await updateProfile\(user, { photoURL: downloadURL }\);/, `console.log("awaiting auth updateProfile");
      await updateProfile(user, { photoURL: downloadURL });
      console.log("auth updateProfile done");`);

code = code.replace(/await syncFirebase\.updateProfile\({ photoURL: downloadURL }\);/, `console.log("awaiting syncFirebase.updateProfile");
      await syncFirebase.updateProfile({ photoURL: downloadURL });
      console.log("syncFirebase.updateProfile done");`);

code = code.replace(/refreshUser\(\);/, `console.log("awaiting refreshUser");
      await refreshUser();
      console.log("refreshUser done");`);

fs.writeFileSync('src/components/ProfileSection.tsx', code);
