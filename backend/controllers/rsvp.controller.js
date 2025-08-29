const models = require("../models");
const { RSVP, Event, User } = models;
const { successResponse, errorResponse } = require("../utils/responseHandler");
const { Op } = require("sequelize");

// Get all RSVPs (admin only)
exports.getAllRSVPs = async (req, res) => {
  try {
    const rsvps = await RSVP.findAll({ include: [Event, User] });
    return successResponse(res, 200, "All RSVPs fetched", { rsvps });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Get all RSVPs for a specific event
exports.getRSVPsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const rsvps = await RSVP.findAll({ where: { eventId }, include: [User] });
    return successResponse(res, 200, "RSVPs for event fetched", { rsvps });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Get all RSVPs for a specific user
exports.getRSVPsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const rsvps = await RSVP.findAll({ where: { userId }, include: [Event] });
    return successResponse(res, 200, "RSVPs for user fetched", { rsvps });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Helper: Check if event date is in the past
async function isEventPast(eventId) {
  const event = await Event.findByPk(eventId);
  if (!event) return true;
  return new Date(event.date) < new Date();
}

// Update logic in requestToJoinEvent, handleRSVP, inviteToPrivateEvent
exports.requestToJoinEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;
    const event = await Event.findByPk(eventId);
    if (!event) return errorResponse(res, 404, "Event not found");
    if (await isEventPast(eventId))
      return errorResponse(res, 400, "Event date has passed");
    if (event.visibility !== "public")
      return errorResponse(res, 400, "Cannot request to join private event");
    const existing = await RSVP.findOne({ where: { eventId, userId } });
    if (existing)
      return errorResponse(res, 400, "Already requested or invited");
    const rsvp = await RSVP.create({ eventId, userId, status: "pending" });
    return successResponse(res, 201, "Join request sent", { rsvp });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

exports.handleRSVP = async (req, res) => {
  try {
    const { id } = req.params; // RSVP id
    const { status } = req.body; // going, rejected
    const rsvp = await RSVP.findByPk(id, { include: [Event, User] });
    if (!rsvp) return errorResponse(res, 404, "RSVP not found");
    const event = rsvp.Event;
    if (await isEventPast(event.id))
      return errorResponse(res, 400, "Event date has passed");
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

exports.inviteToPrivateEvent = async (req, res) => {
  try {
    const { eventId, email } = req.body;
    const event = await Event.findByPk(eventId);
    if (!event) return errorResponse(res, 404, "Event not found");
    if (await isEventPast(eventId))
      return errorResponse(res, 400, "Event date has passed");
    if (event.visibility !== "private")
      return errorResponse(res, 400, "Event is not private");
    if (req.user.role !== "admin" && event.createdBy !== req.user.id) {
      return errorResponse(res, 403, "Not authorized");
    }
    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        name: email.split("@")[0],
        email,
        password: "temp" + Date.now(),
        role: "user",
      });
    }
    let rsvp = await RSVP.findOne({ where: { eventId, userId: user.id } });
    if (!rsvp) {
      rsvp = await RSVP.create({ eventId, userId: user.id, status: "pending" });
    }
    const inviteLink = `${req.protocol}://${req.get("host")}/api/events/accept-invite/${rsvp.id}`;
    await require("../services/emailService").sendEmail(
      user.email,
      `You're invited to a private event!`,
      `<p>You have been invited to join the event <b>${event.title}</b>.<br>Click <a href="${inviteLink}">here</a> to accept the invitation.</p>`
    );
    return successResponse(res, 200, "Invitation sent");
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const { id } = req.params; // RSVP id
    const rsvp = await RSVP.findByPk(id, { include: [Event, User] });
    if (!rsvp) return errorResponse(res, 404, "Invite not found");
    if (await isEventPast(rsvp.eventId))
      return errorResponse(res, 400, "Event date has passed");
    if (rsvp.status !== "pending")
      return errorResponse(res, 400, "Invite already handled");
    rsvp.status = "going";
    await rsvp.save();
    return successResponse(res, 200, "Invitation accepted");
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};
