const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'pinimg.jpg');
const destDir = 'C:\\Users\\pmdan\\.gemini\\antigravity-ide\\brain\\c8dbfaff-c8f0-4cae-9313-ed7fb30fd84a';
const dest = path.join(destDir, 'pinimg.jpg');

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('Copy completed.');
