// utils/tokenUtils.js
const jwt = require('jsonwebtoken');
const { RefreshToken } = require('../models'); // Make sure path is correct

// Generate access token (short-lived)
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
}

// Generate and store refresh token in DB (long-lived)
async function generateRefreshToken(user) {
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  // Store refresh token in the database using camelCase
  await RefreshToken.create({
    token,
    userId: user.id, // ✅ this is correct and matches your model
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });

  return token;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
