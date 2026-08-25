const fs = require('fs');
let code = fs.readFileSync('build-icons.js', 'utf8');

const target = `    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(icon192Path);`;

const replacement = `    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(icon192Path);

    const notificationIconPath = path.resolve('public/icons/notification-icon.png');
    await sharp(svgBuffer)
      .resize(128, 128)
      .extend({
        top: 32,
        bottom: 32,
        left: 32,
        right: 32,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(notificationIconPath);`;

code = code.replace(target, replacement);

fs.writeFileSync('build-icons.js', code);
console.log("Patched build-icons.js");
