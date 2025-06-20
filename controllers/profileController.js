// controllers/profileController.js
const { UserProfile, UserSettings } = require('../models');

// -------------------------
// Get Profile Info
// -------------------------
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await UserProfile.findOne({ where: { userId } });
    res.json(profile || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile data.' });
  }
};

// -------------------------
// Update Profile Info
// -------------------------
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, age, gender, nationality, occupation, phone } = req.body;

    const [profile, created] = await UserProfile.upsert({
      userId,
      full_name,
      age,
      gender,
      nationality,
      occupation,
      phone
    });

    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// -------------------------
// Get Settings
// -------------------------
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await UserSettings.findOne({ where: { userId } });
    res.json(settings || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
};

// -------------------------
// Update Settings
// -------------------------
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email_notifications, dark_mode, language } = req.body;

    const [settings, created] = await UserSettings.upsert({
      userId,
      email_notifications,
      dark_mode,
      language
    });

    res.json({ message: 'Settings updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
};
