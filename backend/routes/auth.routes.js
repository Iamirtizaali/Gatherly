const express = require("express");
const {
  register,
  login,
  getProfile,
  forgetPassword,
  resetPassword,
  logout,
} = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.post("/forget-password", forgetPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", authMiddleware, logout);

module.exports = router;
