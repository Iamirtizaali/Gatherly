const express = require("express");
const commentController = require("../controllers/comment.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

const router = express.Router();

// Add comment or reply
router.post("/", authMiddleware, commentController.addComment);
// Get all comments for event (nested)
router.get(
  "/events/:eventId",
  authMiddleware,
  commentController.getCommentsByEvent
);
// Delete comment (user or admin)
router.delete("/:id", authMiddleware, commentController.deleteComment);

module.exports = router;
