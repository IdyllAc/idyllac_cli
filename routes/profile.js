// routes/profile.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/jwtMiddleware');
const {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings
} = require('../controllers/profileController');

// Profile routes
router.get('/profile', authenticateToken, getProfile);
router.post('/profile', authenticateToken, updateProfile);

// Settings routes
router.get('/settings', authenticateToken, getSettings);
router.post('/settings', authenticateToken, updateSettings);

module.exports = router;

