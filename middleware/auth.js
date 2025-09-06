const ErrorHandler = require("../utils/errorHandler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Middleware to check the user is authenticated or not
const isAuthenticatedUser = async (req, res, next) => {
  try {
    let token;

    // Check from header (Bearer token)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new ErrorHandler("Please login to access this resource", 401)
      );
    }

    // Verify token
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decodedData.id);

    if (!req.user) {
      return next(new ErrorHandler("User not found", 404));
    }

    next();
  } catch (err) {
    return next(new ErrorHandler("Invalid or expired token", 401));
  }
};

module.exports = { isAuthenticatedUser };
