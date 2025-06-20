require('dotenv').config(); // MUST be the very first line
const { Sequelize } = require('sequelize');


const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
   {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: process.env.DB_DIALECT || 'mysql', // Using MySQL
    logging: false, // optional: disables Sequelize logging for cleaner console output
  } 
);
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

    // ✅ Export the Sequelize instance
module.exports = sequelize;


