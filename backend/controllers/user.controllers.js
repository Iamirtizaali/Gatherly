const models = require("../models");
const User = models.User;
const { successResponse, errorResponse } = require("../utils/responseHandler");

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password", "otp", "otpExpires"] },
    });
    return successResponse(res, 200, "All users fetched", { users });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password", "otp", "otpExpires"] },
    });
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }
    return successResponse(res, 200, "User fetched", { user });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Get user by email
exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({
      where: { email },
      attributes: { exclude: ["password", "otp", "otpExpires"] },
    });
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }
    return successResponse(res, 200, "User fetched", { user });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};
