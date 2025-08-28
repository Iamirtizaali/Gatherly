const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const models = require("../models");
const User = models.User;
const { successResponse, errorResponse } = require("../utils/responseHandler");
const { sendEmail } = require("../services/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// User Registration
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 400, "All fields are required");
    }

    const myUser = await User.findOne({ where: { email } });
    if (myUser) {
      return errorResponse(res, 400, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });
    const token = jwt.sign({ id: newUser.id, role }, JWT_SECRET, {
      expiresIn: "15m",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only https in production
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    return successResponse(res, 201, "User registered successfully", {
      user: newUser,
    });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// User Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Logging in user:", email);

    const myUser = await User.findOne({ where: { email } });
    if (!myUser) {
      return errorResponse(res, 400, "Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, myUser.password);
    if (!isMatch) {
      return errorResponse(res, 400, "Invalid credentials");
    }

    const token = jwt.sign({ id: myUser.id }, JWT_SECRET, { expiresIn: "1h" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only https in production
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour
    });
    return successResponse(res, 200, "Login successful", { user: myUser });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Get User Profile (Protected Route)
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const myUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!myUser) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(res, 200, "User profile fetched", { user: myUser });
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const myUser = await User.findOne({ where: { email } });
    if (!myUser) {
      return errorResponse(res, 404, "User not found");
    }
    // console.log(myUser);
    // console.log("Found user:", myUser);

    const token = jwt.sign({ id: myUser.id }, JWT_SECRET, { expiresIn: "15m" });
    const resetLink = `${req.protocol}://${req.get("host")}/api/auth/reset-password/${token}`;

    await sendEmail(
      myUser.email,
      "Password Reset",
      `<p>Click <a href="${resetLink}">here</a> to reset your password</p>`
    );

    return successResponse(res, 200, "Password reset link sent");
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return errorResponse(res, 400, "Token and new password are required");
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const myUser = await User.findByPk(decoded.id);

    if (!myUser) {
      return errorResponse(res, 404, "User not found");
    }

    myUser.password = await bcrypt.hash(newPassword, 10);
    await myUser.save();

    return successResponse(res, 200, "Password reset successful");
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  return successResponse(res, 200, "Logout successful");
};
