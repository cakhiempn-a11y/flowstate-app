const sharp = require('sharp');
const fs = require('fs');

const svgContent = fs.readFileSync('public/icons/logo.svg', 'utf8');

// Ensure explicit width/height for sharp if missing, but viewBox is usually enough
const fixedSvg = svgContent.replace('<svg ', '<svg width="512" height="512" ');

async function run() {
  try {
    await sharp(Buffer.from(fixedSvg))
      .resize(192, 192)
      .png()
      .toFile('public/icons/icon-192.png');
    console.log('Successfully generated icon-192.png');

    await sharp(Buffer.from(fixedSvg))
      .resize(512, 512)
      .png()
      .toFile('public/icons/icon-512.png');
    console.log('Successfully generated icon-512.png');
    
    // Check files magic bytes
    const buf192 = fs.readFileSync('public/icons/icon-192.png');
    const buf512 = fs.readFileSync('public/icons/icon-512.png');
    console.log('192 bytes:', buf192.slice(0, 8).toString('hex'));
    console.log('512 bytes:', buf512.slice(0, 8).toString('hex'));
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
