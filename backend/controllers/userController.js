import User from "../models/userModel.js";
import Manga from "../models/mangaModel.js";
import mongoose from "mongoose"; // Add this import at the top

// Get the logged-in user's profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Admin: Get all users
export const getAllUsers = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Permission denied" });
  }

  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Add manga to a specific list (reading, wantToRead, or completed)
export const addToUserList = async (req, res) => {
  try {
    const { mangaId, listType } = req.body;

    // Validate listType
    if (!["reading", "wantToRead", "completed"].includes(listType)) {
      return res.status(400).json({ message: "Invalid list type" });
    }

    // Use the logged-in user's ID from req.user.id
    const userId = req.user.id;

    // Find the user and manga
    const user = await User.findById(userId).select("-password");
    const manga = await Manga.findById(mangaId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    // Check if manga is already in the appropriate list
    if (listType === "completed") {
      // Check if manga is already in the completed list
      if (
        user.lists.completed.some(
          (item) => item.manga && item.manga.toString() === mangaId
        )
      ) {
        return res
          .status(400)
          .json({ message: "Manga is already in the completed list" });
      }

      // Add manga with dateRead for completed list
      user.lists.completed.push({
        manga: manga._id, // Add manga ID
        dateRead: new Date(), // Set current date as dateRead
      });
    } else {
      // Check if manga is already in the reading or wantToRead list
      if (user.lists[listType].includes(mangaId)) {
        return res
          .status(400)
          .json({ message: "Manga is already in this list" });
      }
      // Add manga ID for other lists
      user.lists[listType].push(manga._id);
    }

    // Save the updated user document
    await user.save();

    res.status(200).json({ message: `Manga added to ${listType} list`, user });
  } catch (err) {
    console.error("Error in addToUserList:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to get a user's lists (Reading, Want to Read, Completed)
export const getUserLists = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "lists.reading lists.wantToRead lists.completed",
      "title genre description image"
    ); // Populate manga fields (title, genre, etc.)

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.lists); // Return the user's lists with populated manga details
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to generate report (e.g., Manga read in last month/year or genre-wise)
export const generateReport = async (req, res) => {
  const { userId } = req.params; // Assuming userId is passed as a parameter
  const { period = "month", genreFilter } = req.query; // period: "month" or "year"

  try {
    const user = await User.findById(userId).populate(
      "lists.completed",
      "title genre"
    ); // Populate manga fields (title, genre)

    if (!user) {
      console.error("User not found", userId);
      return res.status(404).json({ message: "User not found" });
    }

    const currentDate = new Date();
    let startDate;

    // Determine the start date based on the period (month or year)
    if (period === "year") {
      startDate = new Date(currentDate.getFullYear(), 0, 1); // Start of the year
    } else if (period === "month") {
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ); // Start of this month
    } else {
      console.error("Invalid period", period);
      return res
        .status(400)
        .json({ message: "Invalid period. Use 'month' or 'year'." });
    }

    // Filter completed list by the dateRead (which is stored in the User schema)
    const filteredCompleted = user.lists.completed.filter((manga) => {
      // Ensure that dateRead is available in the User schema (not Manga schema)
      return manga.dateRead && new Date(manga.dateRead) >= startDate;
    });

    // If genreFilter is provided, filter manga by genre
    const filteredByGenre = genreFilter
      ? filteredCompleted.filter((manga) => manga.genre === genreFilter)
      : filteredCompleted;

    // Count total manga read
    const totalMangaRead = filteredByGenre.length;

    // Count manga by genre
    const genreCounts = filteredByGenre.reduce((acc, manga) => {
      acc[manga.genre] = acc[manga.genre] ? acc[manga.genre] + 1 : 1;
      return acc;
    }, {});

    // Prepare the response data
    const reportData = {
      totalMangaRead,
      genreCounts,
      period, // Period (month or year)
      startDate,
    };

    res.json(reportData); // Return the generated report data
  } catch (err) {
    console.error("Server error in generateReport:", err);
    res.status(500).json({ message: "Server error" });
  }
};
