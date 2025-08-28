require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/auth.routes");
const sequelize = require("./config/database");
const cookieParser = require("cookie-parser");

const app = express();

// Middleware

app.use(cookieParser());
app.use(bodyParser.json());
// CORS setup to allow cookies from frontend
app.use(
  cors({
    origin: "http://localhost:3000", // your React app
    credentials: true, // allow sending cookies
  })
);

// Routes
app.use("/api/auth", userRoutes);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Express API Kit! 🚀",
    CreatedBy: "Express Generator API Kit Created by Muhammad Ahmad with ❤️.",
    status: "Running Smoothly ✅",
    version: "1.0.0",
  });
});

module.exports = app;
