// models/EventLike.js
module.exports = (sequelize, DataTypes) => {
  const EventLike = sequelize.define("EventLike", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    eventId: { type: DataTypes.INTEGER, allowNull: false },
  });
  EventLike.associate = (models) => {
    EventLike.belongsTo(models.User, { foreignKey: "userId" });
    EventLike.belongsTo(models.Event, { foreignKey: "eventId" });
  };
  return EventLike;
};
