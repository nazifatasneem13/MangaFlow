import Review from "../models/reviewModel.js";
import Manga from "../models/mangaModel.js";

// Controller to create a review (including replies)
export const createReview = async (req, res) => {
  const { mangaId, rating, comment, parentReview } = req.body;

  try {
    // Ensure the user is authenticated and attached to req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    // Check if the manga exists
    const manga = await Manga.findById(mangaId);
    if (!manga) return res.status(404).json({ msg: "Manga not found" });

    // Check if the user has already reviewed this manga
    const existingReview = await Review.findOne({
      manga: mangaId,
      user: req.user.id,
      parentReview: null, // Ensure the user hasn't already reviewed the manga without a reply
    });
    if (existingReview) {
      return res.status(400).json({
        msg: "You have already reviewed this manga. Please update your review.",
      });
    }

    // Create the review if it doesn't exist
    const review = new Review({
      user: req.user.id, // Use the user ID from the authenticated user
      manga: mangaId,
      rating,
      comment,
      parentReview, // Set the parentReview if this is a reply
    });

    // Save the review
    await review.save();

    // Add the review to the manga's reviews array (optional)
    manga.reviews.push(review._id);
    await manga.save();

    // If it's a reply, also add the review ID to the parent review's replies
    if (parentReview) {
      const parent = await Review.findById(parentReview);
      if (parent) {
        parent.replies.push(review._id);
        await parent.save();
      }
    }

    // Return the review
    res.status(201).json(review);
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Controller to get all reviews for a specific manga (with nested replies)
export const getReviewsForManga = async (req, res) => {
  try {
    const { mangaId } = req.params;
    const { rating } = req.query;

    // Fetch the manga document
    const manga = await Manga.findById(mangaId).populate("reviews");
    if (!manga) return res.status(404).json({ msg: "Manga not found" });

    // Build the filter object
    let filter = { manga: mangaId };
    if (rating) {
      filter.rating = { $gte: parseInt(rating) }; // Filter reviews by rating
    }

    // Fetch reviews from the database with optional rating filter and sorting by date
    const reviews = await Review.find(filter)
      .sort({ date: -1 })
      .populate("parentReview"); // Populate the parentReview to include replies

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Update review by ID (for the logged-in user or admin)
export const updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  try {
    // Find the review
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if the logged-in user is the one who created the review or if the user is an admin
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Update the review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    // Save the updated review
    await review.save();

    res.json({ message: "Review updated successfully", review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete review by ID (for the logged-in user or admin)
export const deleteReview = async (req, res) => {
  const { reviewId } = req.params;

  try {
    // Find the review
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if the logged-in user is the one who created the review or if they are an admin
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Permission denied" });
    }

    // If it's a reply, remove it from the parent review's replies array
    if (review.parentReview) {
      const parentReview = await Review.findById(review.parentReview);
      if (parentReview) {
        parentReview.replies.pull(review._id);
        await parentReview.save();
      }
    }

    // Delete the review
    await review.remove();

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
