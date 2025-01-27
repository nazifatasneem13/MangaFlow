import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// Middleware to check if the user is an admin
export const isAdmin = async (req, res, next) => {
  try {
    // Get token from the Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's a Google OAuth user (userId in payload)
    const userId = decoded.userId ? decoded.userId : decoded.id;

    // Find user based on decoded userId (Google OAuth or normal user) and ensure they are an admin
    const user = await User.findById(userId); // Use decoded.userId or decoded.id based on the token payload

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Attach user info to request object
    req.user = user;
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Middleware to protect routes
export const protect = async (req, res, next) => {
  // Get token from the Authorization header
  const token = req.header("Authorization")?.replace("Bearer ", ""); // Remove "Bearer " from token
  console.log("Received Token: ", token);

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token: ", decoded); // Log the decoded token to check

    // Check if it's a Google OAuth user (userId in payload)
    const userId = decoded.userId ? decoded.userId : decoded.id;

    // Fetch the user from the database based on the userId (Google OAuth or normal user)
    const user = await User.findById(userId).select("-password"); // Exclude password for security

    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    // Attach the user object to req.user
    req.user = user;

    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error(err);
    res.status(401).json({ msg: "Token is not valid" });
  }
};
