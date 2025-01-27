import express from "express";
import {
  generateReport,
  getUserProfile,
  getAllUsers,
  addToUserList,
  getUserLists,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get logged-in user's profile
router.get("/profile", protect, getUserProfile);

// Route to add manga to a specific list (Reading, Want to Read, Completed)
router.post("/add-to-list", protect, addToUserList); // POST request to add manga to a list

// Admin route: Get all users
router.get("/", protect, getAllUsers);

// Route to get a user's lists (Reading, Want to Read, Completed)
router.get("/:userId/lists", protect, getUserLists); // GET request to fetch user lists

// Route to generate user report (e.g., manga read in last month or year)
router.get("/:userId/report", protect, generateReport);

export default router;
