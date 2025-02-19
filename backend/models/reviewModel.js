import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    manga: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manga",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    }, // Allow rating only for parent reviews
    comment: { type: String, minlength: 5, maxlength: 500, required: true },
    parentReview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      default: null,
    },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }], // Replies array
  },
  {
    timestamps: true,
  }
);

// Prevent replies from having a rating
ReviewSchema.pre("save", function (next) {
  if (this.parentReview && this.rating) {
    return next(new Error("Replies cannot have a rating."));
  }
  next();
});

export default mongoose.model("Review", ReviewSchema);
