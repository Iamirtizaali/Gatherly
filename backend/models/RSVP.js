// models/RSVP.js
module.exports = (sequelize, DataTypes) => {
  const RSVP = sequelize.define("RSVP", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    status: {
      type: DataTypes.ENUM("going", "interested", "not_going", "pending"),
      defaultValue: "pending",
    },
  });

  RSVP.associate = (models) => {
    RSVP.belongsTo(models.User, { foreignKey: "userId" });
    RSVP.belongsTo(models.Event, { foreignKey: "eventId" });
  };

  return RSVP;
};
