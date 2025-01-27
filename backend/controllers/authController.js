import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import dotenv from "dotenv";
import passport from "passport";

// Register a new user
export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    user = new User({
      username,
      email,
      password: await bcrypt.hash(password, 10),
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10h",
    });
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Log in an existing user
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = bcrypt.compareSync(password, user.password);
    console.log(`Password match: ${isMatch}`);

    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10h",
    });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Update user profile (for both users and admin)
export const updateUserProfile = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Allow users to update their own info, admins can update any user's info
    if (req.user.role === "admin" || req.user.id === user._id) {
      user.username = username || user.username;
      user.email = email || user.email;
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }
      if (role && req.user.role === "admin") {
        user.role = role;
      }

      await user.save();
      res.json(user);
    } else {
      res.status(403).json({ msg: "Permission denied" });
    }
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Admin: Delete a user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Permission denied" });
    }

    await user.remove();
    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

dotenv.config();

// Redirect user to Google for authentication
export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

// Callback from Google after authentication
export const googleCallback = [
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    try {
      // Issue JWT after successful authentication
      const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION,
      });
      res.json({ token }); // Return JWT token
    } catch (error) {
      console.error("Error generating token:", error);
      res.status(500).json({ msg: "Server error" });
    }
  },
];
