import mongoose from "mongoose";

// Create User schema
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String }, // Added to store Google OAuth ID
    githubId: { type: String },
    role: { type: String, default: "user", enum: ["user", "admin"] },
    lists: {
      reading: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Manga", // Reference to the Manga model
        },
      ], // List of mangas the user is currently reading
      wantToRead: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Manga", // Reference to the Manga model
        },
      ], // List of mangas the user wants to read
      completed: [
        {
          manga: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Manga", // Reference to the Manga model
            required: true,
          },
          dateRead: { type: Date, required: true }, // Track when a user completes a manga
        },
      ], // List of mangas the user has completed
    },
  },
  {
    timestamps: true, // Automatically include createdAt and updatedAt fields
  }
);

export default mongoose.model("User", UserSchema);
