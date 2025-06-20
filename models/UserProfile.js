// models/UserProfile.js
module.exports = (sequelize, DataTypes) => {
    const UserProfile = sequelize.define('UserProfile', {
      full_name: DataTypes.STRING,
      age: DataTypes.INTEGER,
      gender: DataTypes.STRING,
      nationality: DataTypes.STRING,
      occupation: DataTypes.STRING,
      phone: DataTypes.STRING,
      userId: {
        type: DataTypes.INTEGER,
        unique: true
      }
    });
  
    return UserProfile;
  };
  