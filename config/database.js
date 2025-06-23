require('dotenv').config(); // Load environment variables FIRST
const { Sequelize } = require('sequelize');

// ✅ Validate essential DB env vars before continuing
if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error('❌ Missing database environment variables in .env');
  process.exit(1); // Stop the app
}

// ✅ Proceed to initialize Sequelize
// Use environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || '127.0.0.1',       // ✅ fallback if DB_HOST missing
    dialect: process.env.DB_DIALECT || 'mysql',    // ✅ fallback if DB_DIALECT missing
    logging: false, // Optional: disable Sequelize's SQL logging
  }
);

// For debugging – shows what env variables are being read
console.log('DB ENV:', {
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_HOST
});

// Test the connection
sequelize.authenticate()
  .then(() => console.log('✅ MySQL Database synced with updated schema'))
  .catch(err => console.error('❌ DB connection failed:', err));

// Export instance
module.exports = sequelize;
