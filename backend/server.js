import express from "express";
import passport from "passport";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import mangaRoutes from "./routes/mangaRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import "./config/passport.js";
import { verifySafeUrl } from "./utils/verify-url.js";
import { doesResolveToLocalhost } from "./utils/dns-resolve.js";

dotenv.config();

const app = express();

// DB connection
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize passport
app.use(passport.initialize());

// Route for URL validation
app.post("/api/validate-url", async (req, res) => {
  const { url } = req.body;

  // Verify if the URL is safe (await the result)
  const result = await verifySafeUrl(url);
  if (!result.isValid) {
    return res.status(400).json({ message: result.message });
  }

  // Check if the URL resolves to localhost (loopback address)
  const isLoopback = await doesResolveToLocalhost(url);
  if (isLoopback) {
    return res
      .status(400)
      .json({ message: "URL resolves to localhost (loopback address)" });
  }

  return res.status(200).json({ message: "URL is valid and safe" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/mangas", mangaRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
