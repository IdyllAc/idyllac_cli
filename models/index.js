// models/index.js
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/database.js'); // if using Sequelize instance directly
const basename = path.basename(__filename);

const db = {}; // Initialize an empty object to collect models

// Dynamically load all models
fs.readdirSync(__dirname)
  .filter((file) => file !== basename && file.endsWith('.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Setup model associations if defined 
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) db[modelName].associate(db);
  });

// Export sequelize instance and all models
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
