const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticateToken = require('../middleware/jwtMiddleware');
const uploadController = require('../controllers/uploadController');
const { submitPersonalInfo } = require('../controllers/personalInfoController');

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.user.id;
    const userDir = path.join(__dirname, '..', 'uploads', String(userId));
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname === 'selfie' ? 'selfie-temp.jpg' : file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});


router.post('/submit/personal_info', authenticateToken, submitPersonalInfo);


// ✅ Route: Upload Documents
router.post(
  '/upload/document',
  authenticateToken,
  upload.fields([
    { name: 'passport_path', maxCount: 1 },
    { name: 'id_card_path', maxCount: 1 },
    { name: 'license_path', maxCount: 1 }
  ]),
  uploadController.uploadDocuments
);

// ✅ Route: Upload Selfie
router.post(
  '/upload/selfie',
  authenticateToken,
  upload.single('selfie'),
  uploadController.uploadSelfie
);

module.exports = router;
