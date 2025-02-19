import express from "express";
import { generateTopMangaReport } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js"; // Add authentication middleware if needed

const router = express.Router();

// Define the report route
router.get("/top-manga-report", protect, generateTopMangaReport);

export default router;
