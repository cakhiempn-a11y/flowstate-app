import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgPath = path.resolve('public/icons/logo.svg');
const icon192Path = path.resolve('public/icons/icon-192.png');
const icon512Path = path.resolve('public/icons/icon-512.png');

async function generateIcons() {
  try {
    let svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // Ensure explicit width/height for sharp if missing, but viewBox is usually enough
    if (!svgContent.includes('width=')) {
      svgContent = svgContent.replace('<svg ', '<svg width="512" height="512" ');
    }

    const svgBuffer = Buffer.from(svgContent);

    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(icon192Path);
      
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(icon512Path);
      
    console.log('✅ Icons generated successfully (192x192, 512x512).');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
