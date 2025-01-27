import express from "express";
import multer from "multer";
import {
  getMangaById,
  addManga,
  getMangas,
  deleteManga,
  updateManga,
} from "../controllers/mangaController.js";
import { isAdmin, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer setup for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Specify where to store the uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Not an image!"), false); // Reject the file
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Routes
router.get("/:id", getMangaById);
router.post("/", protect, isAdmin, upload.single("image"), addManga); // Image upload handling
router.delete("/:id", protect, isAdmin, deleteManga);
router.put("/:id", isAdmin, upload.single("image"), updateManga); // Image upload handling
router.get("/", getMangas);

export default router;
