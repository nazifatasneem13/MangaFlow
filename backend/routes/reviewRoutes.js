import express from "express";
import {
  createReview,
  getReviewsForManga,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route for creating a new review
router.post("/", protect, createReview);

// Route for getting all reviews for a specific manga, with optional filters
router.get("/:mangaId/reviews", getReviewsForManga);

// Route to update a review
router.put("/:reviewId", protect, updateReview);

// Route to delete a review
router.delete("/:reviewId", protect, deleteReview);

export default router;
