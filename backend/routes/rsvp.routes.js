const express = require("express");
const rsvpController = require("../controllers/rsvp.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

const router = express.Router();

// Get all RSVPs (admin only)
router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  rsvpController.getAllRSVPs
);
// Get all RSVPs for a specific event
router.get("/events/:eventId", authMiddleware, rsvpController.getRSVPsByEvent);
// Get all RSVPs for a specific user
router.get("/users/:userId", authMiddleware, rsvpController.getRSVPsByUser);
// Request to join public event (logic in event controller, but route here for RESTful completeness)
// router.post("/", authMiddleware, rsvpController.requestToJoinEvent);
// Organizer handles RSVP (accept/reject) (logic in event controller, but route here for RESTful completeness)
// router.put("/:id", authMiddleware, authorizeRoles("organizer", "admin"), rsvpController.handleRSVP);

module.exports = router;
