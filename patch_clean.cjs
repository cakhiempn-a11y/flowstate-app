const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileSection.tsx', 'utf8');

code = code.replace(/console\.log\("awaiting getCroppedImg"\);\n      const croppedImageBase64 = await getCroppedImg\(selectedImage, croppedAreaPixels\);\n      console\.log\("getCroppedImg done"\);/g, "const croppedImageBase64 = await getCroppedImg(selectedImage, croppedAreaPixels);");

code = code.replace(/console\.log\("awaiting uploadString"\);\n      await uploadString\(avatarRef, croppedImageBase64, 'data_url'\);\n      console\.log\("uploadString done"\);/g, "await uploadString(avatarRef, croppedImageBase64, 'data_url');");

code = code.replace(/console\.log\("awaiting getDownloadURL"\);\n      const downloadURL = await getDownloadURL\(avatarRef\);\n      console\.log\("getDownloadURL done: " \+ downloadURL\);/g, "const downloadURL = await getDownloadURL(avatarRef);");

code = code.replace(/console\.log\("awaiting auth updateProfile"\);\n      await updateProfile\(user, { photoURL: downloadURL }\);\n      console\.log\("auth updateProfile done"\);/g, "await updateProfile(user, { photoURL: downloadURL });");

code = code.replace(/console\.log\("awaiting syncFirebase\.updateProfile"\);\n      await syncFirebase\.updateProfile\({ photoURL: downloadURL }\);\n      console\.log\("syncFirebase\.updateProfile done"\);/g, "await syncFirebase.updateProfile({ photoURL: downloadURL });");

code = code.replace(/console\.log\("awaiting refreshUser"\);\n      await refreshUser\(\);\n      console\.log\("refreshUser done"\);/g, "await refreshUser();");
code = code.replace(/console\.log\("handleCropComplete started"\);/g, "");

code = code.replace(/refreshUser\(\);/g, "await refreshUser();");

fs.writeFileSync('src/components/ProfileSection.tsx', code);
