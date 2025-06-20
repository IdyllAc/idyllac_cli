const sharp = require('sharp');

// Inside your /upload/selfie route, after multer saved the file:
const selfieFullPath = path.join(userDir, 'selfie.jpg');

sharp(selfieFullPath)
  .metadata()
  .then(info => {
    console.log('Selfie metadata:', info); // width, height, format, size, etc.

    // Optionally reject if resolution too low
    if (info.width < 200 || info.height < 200) {
      fs.unlinkSync(selfieFullPath); // delete bad file
      return res.status(400).json({ error: 'Selfie resolution too low' });
    }

    // continue saving selfie reference to DB...
  })
  .catch(err => {
    console.error('Sharp error:', err);
    return res.status(500).json({ error: 'Image processing failed' });
  });
