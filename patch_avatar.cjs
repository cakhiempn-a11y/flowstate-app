const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileSection.tsx', 'utf8');

const oldGetCroppedImg = `  const getCroppedImg = (imageSrc: string, pixelCrop: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256; // Fixed avatar size
        canvas.height = 256;
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
          256,
          256
        );
        
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      image.onerror = (error) => reject(error);
    });
  };`;

const newGetCroppedImg = `  const getCroppedImg = (imageSrc: string, pixelCrop: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!pixelCrop) return reject(new Error('No crop area selected'));
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 256; // Fixed avatar size
          canvas.height = 256;
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
            256,
            256
          );
          
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch (e) {
          reject(e);
        }
      };
      image.onerror = (error) => reject(error);
    });
  };`;

if (code.includes(oldGetCroppedImg)) {
    code = code.replace(oldGetCroppedImg, newGetCroppedImg);
    console.log("Patched getCroppedImg");
} else {
    console.log("Could not find getCroppedImg");
}

fs.writeFileSync('src/components/ProfileSection.tsx', code);
