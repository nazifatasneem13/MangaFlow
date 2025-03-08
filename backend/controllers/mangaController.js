import Manga from "../models/mangaModel.js";
import cloudinary from "cloudinary";
import fs from "fs"; // To delete temp files after upload

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Fetch a manga by ID (with reviews)
export const getMangaById = async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id).populate("reviews");
    if (!manga) return res.status(404).json({ msg: "Manga not found" });
    res.json(manga);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Add a new manga (only for admins)
export const addManga = async (req, res) => {
  try {
    const { title, genre, description, chapters, imageUrl, videoUrl, pdfUrl } =
      req.body;

    // Check if necessary fields are provided
    if (!title || !genre || !description || !chapters) {
      return res.status(400).json({
        msg: "All fields (title, genre, description, chapters) are required",
      });
    }

    // Validate if at least one file (image, video, or PDF) is uploaded
    if (!imageUrl && !videoUrl && !pdfUrl) {
      return res.status(400).json({ msg: "Image, video, or PDF is required" });
    }

    // Create a new Manga object and save it to the database
    const newManga = new Manga({
      title,
      genre,
      description,
      image: imageUrl,
      video: videoUrl,
      pdf: pdfUrl,
      chapters,
    });

    await newManga.save();
    res.status(201).json({ message: "Manga added successfully", newManga });
  } catch (err) {
    console.error("Error adding manga:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a manga by ID (only for admins)
export const deleteManga = async (req, res) => {
  try {
    const manga = await Manga.findByIdAndDelete(req.params.id);

    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    res.json({ message: "Manga deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a manga (only for admins)
export const updateManga = async (req, res) => {
  try {
    const { title, genre, description, chapters } = req.body;

    // Use the current image if no new image is uploaded
    let imageUrl = req.body.image; // Fallback to the current image URL if no new image is uploaded
    let videoUrl = req.body.video; // Fallback to the current video URL if no new video is uploaded
    let pdfUrl = req.body.pdf; // Fallback to the current PDF URL if no new PDF is uploaded

    // Upload new image if provided
    if (req.file && req.file.fieldname === "image") {
      const result = await cloudinary.uploader.upload(req.file.path, {
        upload_preset: "MangaFlow",
        folder: "MangaFlow",
      });
      imageUrl = result.secure_url;
    }

    // Upload new video if provided
    if (req.file && req.file.fieldname === "video") {
      const result = await cloudinary.uploader.upload(req.file.path, {
        upload_preset: "MangaFlow",
        folder: "Videos",
        resource_type: "video", // Specify resource_type as video
      });
      videoUrl = result.secure_url;
    }

    // Upload new PDF if provided
    if (req.file && req.file.fieldname === "pdf") {
      const result = await cloudinary.uploader.upload(req.file.path, {
        upload_preset: "MangaFlow",
        folder: "PDFs",
        resource_type: "raw", // Specify resource_type as raw for PDFs
      });
      pdfUrl = result.secure_url;
    }

    // Update the manga document with the new data
    const updatedManga = await Manga.findByIdAndUpdate(
      req.params.id,
      {
        title,
        genre,
        description,
        image: imageUrl,
        video: videoUrl,
        pdf: pdfUrl,
        chapters,
      },
      { new: true }
    );

    if (!updatedManga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    res.json({ message: "Manga updated successfully", updatedManga });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Patch (partial update) a manga (only for admins)
export const patchManga = async (req, res) => {
  try {
    const updates = req.body; // Only update provided fields

    if (req.file) {
      // Upload the new image, video, or PDF to Cloudinary if provided
      if (req.file.fieldname === "image") {
        const result = await cloudinary.uploader.upload(req.file.path, {
          upload_preset: "MangaFlow",
          folder: "MangaFlow",
        });
        updates.image = result.secure_url;
      } else if (req.file.fieldname === "video") {
        const result = await cloudinary.uploader.upload(req.file.path, {
          upload_preset: "MangaFlow",
          folder: "Videos",
          resource_type: "video",
        });
        updates.video = result.secure_url;
      } else if (req.file.fieldname === "pdf") {
        const result = await cloudinary.uploader.upload(req.file.path, {
          upload_preset: "MangaFlow",
          folder: "PDFs",
          resource_type: "raw",
        });
        updates.pdf = result.secure_url;
      }
    }

    // Find and update the manga with only the provided fields
    const updatedManga = await Manga.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    if (!updatedManga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    res.json({ message: "Manga updated successfully", updatedManga });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all mangas with optional filtering, sorting, and pagination
export const getMangas = async (req, res) => {
  try {
    const { genre, title, sortBy = "title", order = "asc" } = req.query;

    // Build the query filter object
    let filter = {};
    if (genre) {
      filter.genre = genre; // Filter by genre
    }
    if (title) {
      filter.title = { $regex: title, $options: "i" }; // Case-insensitive search for title
    }

    // Build the sort object
    let sort = {};
    if (sortBy) {
      sort[sortBy] = order === "asc" ? 1 : -1; // Sort order (ascending or descending)
    }

    // Fetch manga from the database with filters and sorting
    const mangas = await Manga.find(filter).sort(sort);

    res.json({ mangas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
