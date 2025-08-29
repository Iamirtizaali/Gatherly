const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define("User", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM("admin", "organizer", "user"),
      defaultValue: "user",
    },
    profilePic: { type: DataTypes.STRING },
    otp: { type: DataTypes.STRING, allowNull: true },
    otpExpires: { type: DataTypes.DATE, allowNull: true },
  });

  User.associate = (models) => {
    User.hasMany(models.Event, { foreignKey: "createdBy" });
    User.hasMany(models.Comment, { foreignKey: "userId" });
    User.hasMany(models.RSVP, { foreignKey: "userId" });
    User.hasMany(models.EventLike, { foreignKey: "userId" });
  };

  return User;
};
