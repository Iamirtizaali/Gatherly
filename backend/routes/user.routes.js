const express = require("express");
const {
  getAllUsers,
  getUserById,
  getUserByEmail,
} = require("../controllers/user.controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

const router = express.Router();

// Only admin can get all users
router.get("/", authMiddleware, authorizeRoles("admin"), getAllUsers);
// Get user by id (any authenticated user)
router.get("/id/:id", authMiddleware, getUserById);
// Get user by email (any authenticated user)
router.get("/email/:email", authMiddleware, getUserByEmail);

module.exports = router;
