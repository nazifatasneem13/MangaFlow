import mongoose from "mongoose";

// Create Manga schema
const MangaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    genre: { type: String, required: true },
    description: { type: String },
    image: { type: String }, // Stores image URL
    video: { type: String }, // Stores video URL
    pdf: { type: String }, // Store PDF URL
    chapters: { type: Number },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  },
  {
    timestamps: true, // Automatically include createdAt and updatedAt fields
  }
);

export default mongoose.model("Manga", MangaSchema);
