// models/Comment.js
module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define("Comment", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    text: { type: DataTypes.TEXT, allowNull: false },
    parentId: { type: DataTypes.INTEGER, allowNull: true }, // reply-to comment
  });

  Comment.associate = (models) => {
    Comment.belongsTo(models.User, { foreignKey: "userId" });
    Comment.belongsTo(models.Event, { foreignKey: "eventId" });
    Comment.hasMany(models.Comment, { foreignKey: "parentId", as: "replies" }); // self-reference
  };

  return Comment;
};
