import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import { Strategy as GitHubStrategy } from "passport-github2";

dotenv.config();

// Google OAuth Strategy Setup
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"], // Define the scope of the requested data
      session: false, // We don't need session handling for stateless authentication
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists in the database
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Create a new user if not found
          user = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
          });
          await user.save();
        }

        // Return the user object
        done(null, user);
      } catch (err) {
        console.error("Google OAuth Error:", err);
        done(err, null);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
      session: false, // Disable session handling for GitHub OAuth
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          user = new User({
            githubId: profile.id,
            username: profile.username || profile.displayName,
            email:
              profile.emails?.[0]?.value || `${profile.username}@github.com`, // GitHub sometimes doesn't provide email
          });
          await user.save();
        }

        done(null, user); // Pass the user object without relying on session
      } catch (err) {
        console.error("GitHub OAuth error:", err);
        done(err, null);
      }
    }
  )
);

// Session handling is removed, no need for serializeUser or deserializeUser
