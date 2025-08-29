// Like an event (per-user)
exports.likeEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const event = await Event.findByPk(id);
    if (!event) return errorResponse(res, 404, "Event not found");
    const EventLike = require("../models").EventLike;
    const existing = await EventLike.findOne({
      where: { eventId: id, userId },
    });
    if (existing)
      return errorResponse(res, 400, "You have already liked this event");
    await EventLike.create({ eventId: id, userId });
    event.likes += 1;
    await event.save();
    return successResponse(res, 200, "Event liked", { likes: event.likes });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Unlike an event (per-user)
exports.unlikeEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const event = await Event.findByPk(id);
    if (!event) return errorResponse(res, 404, "Event not found");
    const EventLike = require("../models").EventLike;
    const existing = await EventLike.findOne({
      where: { eventId: id, userId },
    });
    if (!existing)
      return errorResponse(res, 400, "You have not liked this event");
    await existing.destroy();
    if (event.likes > 0) event.likes -= 1;
    await event.save();
    return successResponse(res, 200, "Event unliked", { likes: event.likes });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};
const models = require("../models");
const { Event, User, RSVP, Comment } = models;
const { successResponse, errorResponse } = require("../utils/responseHandler");
const { sendEmail } = require("../services/emailService");
const { Op } = require("sequelize");

// Create Event (organizer/admin)
exports.createEvent = async (req, res) => {
  try {
    console.log("Creating event:", req.body);
    const {
      title,
      description,
      category,
      venue,
      date,
      time,
      capacity,
      visibility,
    } = req.body;

    const createdBy = req.user.id;
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/events/${req.file.filename}`;
    }
    const event = await Event.create({
      title,
      description,
      category,
      venue,
      date,
      time,
      capacity,
      visibility,
      image: imagePath,
      createdBy,
    });
    return successResponse(res, 201, "Event created", { event });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Get all events (public + private user has access to)
exports.getAllEvents = async (req, res) => {
  try {
    const { category, date: eventDate, location } = req.query;
    const where = {};
    if (category) where.category = category;
    if (eventDate) where.date = eventDate;
    if (location) where.venue = location;
    // Only public events or private events user is invited to
    where[Op.or] = [
      { visibility: "public" },
      req.user ? { createdBy: req.user.id } : null,
    ].filter(Boolean);
    const events = await Event.findAll({ where });
    return successResponse(res, 200, "Events fetched", { events });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Get event by ID (with RSVPs + comments)
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id, {
      include: [
        {
          model: RSVP,
          include: [{ model: User, attributes: ["id", "name", "email"] }],
        },
        {
          model: Comment,
          include: [{ model: User, attributes: ["id", "name", "email"] }],
        },
      ],
    });
    if (!event) return errorResponse(res, 404, "Event not found");
    return successResponse(res, 200, "Event fetched", { event });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Update event (organizer/admin)
exports.updateEvent = async (req, res) => {
  try {
    console.log("Updating event:", req.body);
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) return errorResponse(res, 404, "Event not found");
    if (req.user.role !== "admin" && event.createdBy !== req.user.id) {
      return errorResponse(res, 403, "Not authorized");
    }
    await event.update(req.body);
    return successResponse(res, 200, "Event updated", { event });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Delete event (organizer/admin)
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) return errorResponse(res, 404, "Event not found");
    if (req.user.role !== "admin" && event.createdBy !== req.user.id) {
      return errorResponse(res, 403, "Not authorized");
    }
    await event.destroy();
    return successResponse(res, 200, "Event deleted");
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Request to join public event
exports.requestToJoinEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;
    const event = await Event.findByPk(eventId);
    if (!event) return errorResponse(res, 404, "Event not found");
    if (event.visibility !== "public")
      return errorResponse(res, 400, "Cannot request to join private event");
    // Check if already requested
    const existing = await RSVP.findOne({ where: { eventId, userId } });
    if (existing)
      return errorResponse(res, 400, "Already requested or invited");
    const rsvp = await RSVP.create({ eventId, userId, status: "pending" });
    return successResponse(res, 201, "Join request sent", { rsvp });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Organizer accepts/rejects RSVP
exports.handleRSVP = async (req, res) => {
  try {
    const { id } = req.params; // RSVP id
    const { status } = req.body; // going, rejected
    const rsvp = await RSVP.findByPk(id, { include: [Event, User] });
    if (!rsvp) return errorResponse(res, 404, "RSVP not found");
    const event = rsvp.Event;
    if (req.user.role !== "admin" && event.createdBy !== req.user.id) {
      return errorResponse(res, 403, "Not authorized");
    }
    if (!["going", "rejected"].includes(status)) {
      return errorResponse(res, 400, "Invalid status");
    }
    rsvp.status = status;
    await rsvp.save();
    return successResponse(res, 200, `RSVP ${status}`, { rsvp });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Organizer invites user to private event
exports.inviteToPrivateEvent = async (req, res) => {
  try {
    const { eventId, email } = req.body;
    console.log("Inviting user:", email, eventId);
    const event = await Event.findByPk(eventId);
    if (!event) return errorResponse(res, 404, "Event not found");
    if (event.visibility !== "private")
      return errorResponse(res, 400, "Event is not private");
    if (req.user.role !== "admin" && event.createdBy !== req.user.id) {
      return errorResponse(res, 403, "Not authorized");
    }
    // Find or create user by email
    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        name: email.split("@")[0],
        email,
        password: "temp" + Date.now(),
        role: "user",
      });
    }
    // Create RSVP with status pending
    let rsvp = await RSVP.findOne({ where: { eventId, userId: user.id } });
    if (!rsvp) {
      rsvp = await RSVP.create({ eventId, userId: user.id, status: "pending" });
    }
    // Send invite email
    const inviteLink = `${req.protocol}://${req.get("host")}/api/events/accept-invite/${rsvp.id}`;
    await sendEmail(
      user.email,
      `You're invited to a private event!`,
      `<p>You have been invited to join the event <b>${event.title}</b>.<br>Click <a href="${inviteLink}">here</a> to accept the invitation.</p>`
    );
    return successResponse(res, 200, "Invitation sent");
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Accept invite to private event
exports.acceptInvite = async (req, res) => {
  try {
    const { id } = req.params; // RSVP id
    const rsvp = await RSVP.findByPk(id, { include: [Event, User] });
    if (!rsvp) return errorResponse(res, 404, "Invite not found");
    if (rsvp.status !== "pending")
      return errorResponse(res, 400, "Invite already handled");
    rsvp.status = "going";
    await rsvp.save();
    return successResponse(res, 200, "Invitation accepted");
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};
