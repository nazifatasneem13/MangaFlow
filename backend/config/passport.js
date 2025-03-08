import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20"; // Correct import
import dotenv from "dotenv";
import User from "../models/userModel.js";
import { Strategy as GitHubStrategy } from "passport-github2";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
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

        done(null, user); // This will pass the user object to the next step
      } catch (err) {
        console.error(err);
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

        done(null, user);
      } catch (err) {
        console.error("GitHub OAuth error:", err);
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id); // Store user id in session
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user); // Retrieve user based on id
});
