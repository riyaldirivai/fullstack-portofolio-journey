const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Category name is required"],
    trim: true,
    maxlength: [50, "Category name cannot exceed 50 characters"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, "Description cannot exceed 200 characters"],
  },
  color: {
    type: String,
    required: [true, "Category color is required"],
    match: [/^#[0-9A-F]{6}$/i, "Color must be a valid hex color"],
  },
  icon: {
    type: String,
    trim: true,
    maxlength: [50, "Icon name cannot exceed 50 characters"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
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
categorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
categorySchema.index({ userId: 1, isActive: 1 });
categorySchema.index({ userId: 1, order: 1 });

// Static method to create default categories for new user
categorySchema.statics.createDefaultCategories = async function (userId) {
  const defaultCategories = [
    {
      name: "Work",
      description: "Professional tasks and projects",
      color: "#3B82F6",
      icon: "briefcase",
      userId,
      isDefault: true,
      order: 1,
    },
    {
      name: "Personal",
      description: "Personal development and life goals",
      color: "#10B981",
      icon: "user",
      userId,
      isDefault: true,
      order: 2,
    },
    {
      name: "Health",
      description: "Health and fitness related goals",
      color: "#F59E0B",
      icon: "heart",
      userId,
      isDefault: true,
      order: 3,
    },
    {
      name: "Learning",
      description: "Education and skill development",
      color: "#8B5CF6",
      icon: "book",
      userId,
      isDefault: true,
      order: 4,
    },
    {
      name: "Finance",
      description: "Financial goals and budgeting",
      color: "#EF4444",
      icon: "dollar-sign",
      userId,
      isDefault: true,
      order: 5,
    },
    {
      name: "Hobby",
      description: "Hobbies and recreational activities",
      color: "#06B6D4",
      icon: "star",
      userId,
      isDefault: true,
      order: 6,
    },
  ];

  return this.insertMany(defaultCategories);
};

// Static method to find active categories for user
categorySchema.statics.findActiveForUser = function (userId) {
  return this.find({ userId, isActive: true }).sort({ order: 1, name: 1 });
};

// Instance method to get goal count
categorySchema.methods.getGoalCount = async function () {
  const Goal = mongoose.model("Goal");
  return await Goal.countDocuments({ category: this._id });
};

module.exports = mongoose.model("Category", categorySchema);
