import express from "express";
import {
  register,
  login,
  updateUserProfile,
  deleteUser,
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import passport from "passport";

const router = express.Router();

// Register and login routes
router.post("/register", register);
router.post("/login", login);

// Profile update route (for both users and admins)
router.put("/profile", protect, updateUserProfile);

// Admin route: Delete a user
router.delete("/:id", protect, deleteUser);

// Route to initiate Google OAuth authentication
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Callback route after Google OAuth authentication
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login", // Redirect if authentication fails
    session: false,
  }),
  googleCallback // Handle successful authentication and JWT generation
);

// Route to initiate GitHub OAuth
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"], session: false })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/login",
    session: false,
  }),
  githubCallback
);

export default router;
