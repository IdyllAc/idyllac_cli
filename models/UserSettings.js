// models/UserSettings.js
module.exports = (sequelize, DataTypes) => {
    const UserSettings = sequelize.define('UserSettings', {
      email_notifications: DataTypes.BOOLEAN,
      dark_mode: DataTypes.BOOLEAN,
      language: DataTypes.STRING,
      userId: {
        type: DataTypes.INTEGER,
        unique: true
      }
    });
  
    return UserSettings;
  };
  