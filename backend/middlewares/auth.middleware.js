const jwt = require("jsonwebtoken");
const { successResponse, errorResponse } = require("../utils/responseHandler");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

module.exports = (req, res, next) => {
  const token =
    req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return errorResponse(res, 401, "No token, authorization denied");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return errorResponse(res, 401, "Invalid token");
  }
};
