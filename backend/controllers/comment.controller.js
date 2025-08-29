const models = require("../models");
const { Comment, User } = models;
const { successResponse, errorResponse } = require("../utils/responseHandler");

// Helper: Recursively build nested comments
async function buildNestedComments(comments, parentId = null) {
  const nested = [];
  for (const comment of comments.filter((c) => c.parentId === parentId)) {
    const replies = await buildNestedComments(comments, comment.id);
    nested.push({ ...comment.get({ plain: true }), replies });
  }
  return nested;
}

// Add comment or reply
exports.addComment = async (req, res) => {
  try {
    const { eventId, text, parentId } = req.body;
    if (!text || !eventId)
      return errorResponse(res, 400, "Text and eventId required");
    const comment = await Comment.create({
      eventId,
      userId: req.user.id,
      text,
      parentId: parentId || null,
    });
    return successResponse(res, 201, "Comment added", { comment });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Get all comments for event (nested/threaded)
exports.getCommentsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const comments = await Comment.findAll({
      where: { eventId },
      include: [{ model: User, attributes: ["id", "name", "email"] }],
      order: [["createdAt", "ASC"]],
    });
    const nested = await buildNestedComments(comments);
    return successResponse(res, 200, "Comments fetched", { comments: nested });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Delete comment (user or admin)
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByPk(id);
    if (!comment) return errorResponse(res, 404, "Comment not found");
    if (req.user.role !== "admin" && comment.userId !== req.user.id) {
      return errorResponse(res, 403, "Not authorized");
    }
    await comment.destroy();
    return successResponse(res, 200, "Comment deleted");
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};
