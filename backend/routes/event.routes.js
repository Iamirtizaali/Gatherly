const express = require("express");
const eventController = require("../controllers/event.controller");
const upload = require("../utils/eventImageUpload");
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");

const router = express.Router();

// Create event (organizer/admin)
router.post(
  "/",
  authMiddleware,
  authorizeRoles("organizer", "admin"),
  upload.single("image"),
  eventController.createEvent
);
// Get all events (public + private user has access to)
router.get("/", eventController.getAllEvents);
// Get event by id (with RSVPs + comments)
router.get("/:id", eventController.getEventById);
// Update event (organizer/admin)
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("organizer", "admin"),
  eventController.updateEvent
);
// Delete event (organizer/admin)
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("organizer", "admin"),
  eventController.deleteEvent
);
// Request to join public event
router.post(
  "/request-join",
  authMiddleware,
  eventController.requestToJoinEvent
);
// Organizer handles RSVP (accept/reject)
router.put(
  "/rsvp/:id",
  authMiddleware,
  authorizeRoles("organizer", "admin"),
  eventController.handleRSVP
);
// Organizer invites user to private event
router.post(
  "/invite",
  authMiddleware,
  authorizeRoles("organizer", "admin"),
  eventController.inviteToPrivateEvent
);
// Accept invite to private event
router.get("/accept-invite/:id", eventController.acceptInvite);
// Like an event
router.post("/:id/like", authMiddleware, eventController.likeEvent);
// Unlike an event
router.post("/:id/unlike", authMiddleware, eventController.unlikeEvent);

module.exports = router;
