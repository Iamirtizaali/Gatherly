// models/Event.js
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define("Event", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    category: { type: DataTypes.STRING },
    venue: { type: DataTypes.STRING },
    date: { type: DataTypes.DATE, allowNull: false },
    time: { type: DataTypes.STRING },
    capacity: { type: DataTypes.INTEGER },
    visibility: {
      type: DataTypes.ENUM("public", "private"),
      defaultValue: "public",
    },
    image: { type: DataTypes.STRING },
    likes: { type: DataTypes.INTEGER, defaultValue: 0 },
  });

  Event.associate = (models) => {
    Event.belongsTo(models.User, { foreignKey: "createdBy", as: "organizer" });
    Event.hasMany(models.Comment, { foreignKey: "eventId" });
    Event.hasMany(models.RSVP, { foreignKey: "eventId" });
    Event.hasMany(models.EventLike, { foreignKey: "eventId" });
  };

  return Event;
};
