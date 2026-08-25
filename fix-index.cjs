const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace(/<script>\s*<\/body>/g, '</body>');
fs.writeFileSync('index.html', content);
