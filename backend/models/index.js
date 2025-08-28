// models/index.js
const { Sequelize, DataTypes } = require("sequelize");
const UserModel = require("./User.js");
const EventModel = require("./Event.js");
const RSVPModel = require("./RSVP.js");
const CommentModel = require("./Comment.js");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false, // disable logs for cleaner console
  }
);

// Initialize models
const models = {};
models.User = UserModel(sequelize, DataTypes);
models.Event = EventModel(sequelize, DataTypes);
models.RSVP = RSVPModel(sequelize, DataTypes);
models.Comment = CommentModel(sequelize, DataTypes);

// Setup associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
