import express from "express";
import multer from "multer";
import path from "path"; // Ensure path is imported
import { fileURLToPath } from "url"; // Import fileURLToPath
import { dirname } from "path"; // Import dirname for path resolution
import fs from "fs"; // To delete temporary files after upload
import cloudinary from "cloudinary";

import {
  getMangaById,
  addManga,
  getMangas,
  deleteManga,
  patchManga,
  updateManga,
} from "../controllers/mangaController.js";
import { isAdmin, protect } from "../middleware/authMiddleware.js";

// Get equivalent of __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// Ensure the 'uploads' directory exists in the backend folder (not in routes)
const uploadPath = path.join(__dirname, "../uploads");

// Check if uploads directory exists and create if not
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log("Uploads directory created:", uploadPath);
} else {
  console.log("Uploads directory exists:", uploadPath);
}

// Multer setup for handling file uploads in memory (buffer)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Log the resolved upload path
    console.log("Resolved Upload Path:", uploadPath); // Log the path to check
    cb(null, uploadPath); // Set the upload path to 'uploads' in the root folder
  },
  filename: (req, file, cb) => {
    const uniqueFilename = Date.now() + "-" + file.originalname;
    console.log("Saving file with name:", uniqueFilename); // Log the filename
    cb(null, uniqueFilename); // Set a unique filename
  },
});

// Updated fileFilter to allow both images, videos, and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "application/pdf", // Allow PDF files
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(
      new Error(
        "Only JPEG, PNG, GIF images and MP4, MPEG, MOV videos, and PDF files are allowed!"
      ),
      false
    );
  }
};

// Set file size limit (e.g., 50MB for videos and PDFs)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Utility function to upload file to Cloudinary
const uploadToCloudinary = async (filePath, folder, resourceType = "auto") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `MangaFlow/${folder}`,
      resource_type: resourceType, // Explicitly set the resource_type to 'video' or 'raw' for PDFs
    });
    // Delete the file after uploading to Cloudinary
    fs.unlinkSync(filePath);
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Cloudinary upload failed");
  }
};

// Route to get a manga by ID
router.get("/:id", getMangaById);

// Route to add a new manga with image/video/PDF upload
router.post(
  "/",
  protect,
  isAdmin,
  upload.fields([{ name: "image" }, { name: "video" }, { name: "pdf" }]),
  async (req, res, next) => {
    try {
      let imageUrl = "";
      let videoUrl = "";
      let pdfUrl = "";

      if (req.files.image) {
        imageUrl = await uploadToCloudinary(
          req.files.image[0].path,
          "Images",
          "auto"
        );
      }
      if (req.files.pdf) {
        // Check if PDF is uploaded
        pdfUrl = await uploadToCloudinary(
          req.files.pdf[0].path,
          "PDFs", // Create a separate folder for PDFs
          "raw" // Use "raw" resource_type for PDFs
        );
      }
      if (req.files.video) {
        videoUrl = await uploadToCloudinary(
          req.files.video[0].path,
          "Videos",
          "auto" // Explicitly telling Cloudinary that this is a video
        );
      }

      // Pass URLs to controller
      req.body.imageUrl = imageUrl;
      req.body.videoUrl = videoUrl;
      req.body.pdfUrl = pdfUrl;
      next();
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  addManga
);

// Route to update a manga with image/video upload
router.put(
  "/:id",
  protect,
  isAdmin,
  upload.fields([{ name: "image" }, { name: "video" }]),
  async (req, res, next) => {
    try {
      let imageUrl = req.body.imageUrl;
      let videoUrl = req.body.videoUrl;

      if (req.files.image) {
        imageUrl = await uploadToCloudinary(
          req.files.image[0].path,
          "Images",
          "image"
        );
      }
      if (req.files.video) {
        videoUrl = await uploadToCloudinary(
          req.files.video[0].path,
          "Videos",
          "video"
        );
      }

      // Pass URLs to controller
      req.body.imageUrl = imageUrl;
      req.body.videoUrl = videoUrl;
      next();
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  updateManga
);

// Route to patch a manga (partially update it)
router.patch("/:id", protect, isAdmin, patchManga);

// Route to delete a manga by ID
router.delete("/:id", protect, isAdmin, deleteManga);

// Route to get all mangas
router.get("/", getMangas);

export default router;
