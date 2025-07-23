const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [50, "Name cannot exceed 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  profilePicture: {
    type: String,
    default: null,
  },
  timezone: {
    type: String,
    default: "UTC",
  },
  preferences: {
    theme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "light",
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
    },
    pomodoro: {
      workDuration: { type: Number, default: 25 }, // minutes
      shortBreak: { type: Number, default: 5 },
      longBreak: { type: Number, default: 15 },
      longBreakInterval: { type: Number, default: 4 },
    },
    dashboard: {
      defaultView: {
        type: String,
        enum: ["overview", "goals", "timer", "analytics"],
        default: "overview",
      },
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to get public profile
userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

module.exports = mongoose.model("User", userSchema);
