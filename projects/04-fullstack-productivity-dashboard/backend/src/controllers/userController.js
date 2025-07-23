const User = require("../models/User");
const { validationResult } = require("express-validator");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");

class UserController {
  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.userId).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      logger.error("Get profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, timezone, preferences } = req.body;

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await User.findOne({
          email,
          _id: { $ne: req.userId },
        });
        if (existingUser) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        { name, email, timezone, preferences },
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      logger.error("Update profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      await user.save();

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      logger.error("Change password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Upload profile picture
  async uploadProfilePicture(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        { profilePicture: req.file.path },
        { new: true }
      ).select("-password");

      res.json({
        message: "Profile picture uploaded successfully",
        profilePicture: user.profilePicture,
      });
    } catch (error) {
      logger.error("Upload profile picture error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Delete user account
  async deleteAccount(req, res) {
    try {
      const { password } = req.body;

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify password before deletion
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Password is incorrect" });
      }

      await User.findByIdAndDelete(req.userId);

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      logger.error("Delete account error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get user preferences
  async getPreferences(req, res) {
    try {
      const user = await User.findById(req.userId).select("preferences");
      res.json(user.preferences || {});
    } catch (error) {
      logger.error("Get preferences error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Update user preferences
  async updatePreferences(req, res) {
    try {
      const { preferences } = req.body;

      const user = await User.findByIdAndUpdate(
        req.userId,
        { preferences },
        { new: true }
      ).select("preferences");

      res.json(user.preferences);
    } catch (error) {
      logger.error("Update preferences error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = new UserController();
