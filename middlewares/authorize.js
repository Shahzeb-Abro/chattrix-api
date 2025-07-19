import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authorize = catchAsync(async (req, res, next) => {
  let token;

  // 1. Get token from cookies or Authorization header
  if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2. If no token found
  if (!token) {
    return next(
      new AppError("You are not logged in. Please log in to continue.", 401)
    );
  }

  // 3. Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 4. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token does not exist.", 401)
    );
  }

  // 5. Grant access
  req.user = currentUser;
  next();
});
