const express = require("express");
const {
  register,
  login,
  getProfile,
  forgetPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  logout,
} = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.post("/forget-password", forgetPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/change-password", authMiddleware, changePassword);
router.post("/logout", authMiddleware, logout);

module.exports = router;
