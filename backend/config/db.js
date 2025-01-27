import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    // Get the MongoDB URI from the environment variables
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.log("Mongo URI is not defined in the .env file");
      return;
    }

    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process if the connection fails
  }
};

export default connectDB;
