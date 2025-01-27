import express from "express";
import {
  register,
  login,
  updateUserProfile,
  deleteUser,
  googleAuth,
  googleCallback,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register and login routes
router.post("/register", register);
router.post("/login", login);

// Profile update route (for both users and admins)
router.put("/profile", protect, updateUserProfile);

// Admin route: Delete a user
router.delete("/:id", protect, deleteUser);

// Route to initiate Google OAuth authentication
router.get("/google", googleAuth);

// Callback route after Google OAuth authentication
router.get("/google/callback", googleCallback);

export default router;
