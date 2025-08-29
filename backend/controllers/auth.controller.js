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

    const token = jwt.sign({ id: myUser.id, role: myUser.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

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

// Forgot Password - Send OTP
exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const myUser = await User.findOne({ where: { email } });
    if (!myUser) {
      return errorResponse(res, 404, "User not found");
    }
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    myUser.otp = otp;
    myUser.otpExpires = otpExpires;
    await myUser.save();

    await sendEmail(
      myUser.email,
      "Password Reset OTP",
      `<p>Your OTP for password reset is: <b>${otp}</b>. It is valid for 10 minutes.</p>`
    );
    return successResponse(res, 200, "OTP sent to email");
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const myUser = await User.findOne({ where: { email } });
    if (!myUser || !myUser.otp || !myUser.otpExpires) {
      return errorResponse(res, 400, "Invalid or expired OTP");
    }
    if (myUser.otp !== otp || new Date() > myUser.otpExpires) {
      return errorResponse(res, 400, "Invalid or expired OTP");
    }
    // OTP is valid
    return successResponse(res, 200, "OTP verified");
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Reset Password with OTP
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    if (!email || !otp || !newPassword || !confirmPassword) {
      return errorResponse(res, 400, "All fields are required");
    }
    if (newPassword !== confirmPassword) {
      return errorResponse(res, 400, "Passwords do not match");
    }
    const myUser = await User.findOne({ where: { email } });
    if (!myUser || !myUser.otp || !myUser.otpExpires) {
      return errorResponse(res, 400, "Invalid or expired OTP");
    }
    if (myUser.otp !== otp || new Date() > myUser.otpExpires) {
      return errorResponse(res, 400, "Invalid or expired OTP");
    }
    myUser.password = await bcrypt.hash(newPassword, 10);
    myUser.otp = null;
    myUser.otpExpires = null;
    await myUser.save();
    return successResponse(res, 200, "Password reset successful");
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

// Change Password (Authenticated)
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return errorResponse(res, 400, "All fields are required");
    }
    if (newPassword !== confirmPassword) {
      return errorResponse(res, 400, "Passwords do not match");
    }
    const myUser = await User.findByPk(userId);
    if (!myUser) {
      return errorResponse(res, 404, "User not found");
    }
    const isMatch = await bcrypt.compare(currentPassword, myUser.password);
    if (!isMatch) {
      return errorResponse(res, 400, "Current password is incorrect");
    }
    myUser.password = await bcrypt.hash(newPassword, 10);
    await myUser.save();
    return successResponse(res, 200, "Password changed successfully");
  } catch (error) {
    return errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  return successResponse(res, 200, "Logout successful");
};
