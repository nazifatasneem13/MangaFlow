import mongoose from "mongoose";

// Define the Review schema
const ReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    manga: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manga",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, minlength: 5, maxlength: 500 },
    parentReview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      default: null,
    },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }], // Array to store replies to this review
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Review", ReviewSchema);
