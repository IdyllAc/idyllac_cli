// controllers/personalInfoController.js
const { PersonalInfo } = require('../models');

exports.submitPersonalInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, address, dob, gender } = req.body;

    // Remove old entry if it exists
    const existing = await PersonalInfo.findOne({ where: { userId } });
    if (existing) await existing.destroy();

    await PersonalInfo.create({
      userId,
      full_name,
      phone,
      address,
      dob,
      gender
    });

    res.json({ message: 'Personal info submitted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit personal info.' });
  }
};
