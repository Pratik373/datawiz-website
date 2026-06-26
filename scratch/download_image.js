const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://i.pinimg.com/736x/2a/b5/89/2ab5897aa984feb80ce0406413525f46.jpg';
const dest = path.join(__dirname, 'pinimg.jpg');

const file = fs.createWriteStream(dest);
https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(() => {
      console.log('Download completed successfully.');
    });
  });
}).on('error', function(err) {
  fs.unlink(dest, () => {});
  console.error('Error downloading file:', err.message);
});
