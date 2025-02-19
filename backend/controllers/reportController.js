import mongoose from "mongoose";
import User from "../models/userModel.js";
import Manga from "../models/mangaModel.js";
import Review from "../models/reviewModel.js";

export const generateTopMangaReport = async (req, res) => {
  try {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);

    console.log(
      `Fetching data between: ${lastMonth.toISOString()} and ${today.toISOString()}`
    );

    // Fetch users who have completed manga in the last month
    const users = await User.find({
      "lists.completed.dateRead": { $gte: lastMonth, $lte: today },
    });

    console.log("Fetched users:", users.length);

    let mangaCount = {};
    let genreCount = {};

    users.forEach((user) => {
      user.lists.completed.forEach((entry) => {
        const mangaId = entry.manga.toString();

        // Count mangas completed
        mangaCount[mangaId] = (mangaCount[mangaId] || 0) + 1;
      });
    });

    // Fetch manga details
    const mangaDetails = await Manga.find({
      _id: { $in: Object.keys(mangaCount) },
    });

    let topMangas = mangaDetails
      .map((manga) => ({
        _id: manga._id,
        title: manga.title,
        genre: manga.genre,
        description: manga.description,
        image: manga.image,
        count: mangaCount[manga._id.toString()],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 completed mangas

    // Count top genres
    topMangas.forEach((manga) => {
      if (Array.isArray(manga.genre)) {
        manga.genre.forEach((g) => {
          genreCount[g] = (genreCount[g] || 0) + manga.count;
        });
      } else {
        genreCount[manga.genre] = (genreCount[manga.genre] || 0) + manga.count;
      }
    });

    const topGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .map(([genre]) => genre)
      .slice(0, 3); // Top 3 genres

    // **Fixing Top Rated Mangas**
    const topRatedMangas = await Review.aggregate([
      {
        $match: {
          createdAt: { $gte: lastMonth, $lte: today }, // Reviews from last 1 month
        },
      },
      {
        $group: {
          _id: "$manga",
          avgRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
      {
        $sort: { avgRating: -1, reviewCount: -1 }, // Sort by highest rating, then most reviews
      },
      {
        $limit: 5, // Get top 5 rated mangas
      },
      {
        $lookup: {
          from: "mangas",
          localField: "_id",
          foreignField: "_id",
          as: "mangaDetails",
        },
      },
      {
        $unwind: "$mangaDetails",
      },
      {
        $project: {
          _id: "$mangaDetails._id",
          title: "$mangaDetails.title",
          genre: "$mangaDetails.genre",
          description: "$mangaDetails.description",
          image: "$mangaDetails.image",
          avgRating: 1,
          reviewCount: 1,
        },
      },
    ]);

    console.log("Top Rated Mangas:", topRatedMangas);

    return res.json({
      topMangas,
      topGenres,
      topRatedMangas,
    });
  } catch (error) {
    console.error("Error generating top manga report:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
