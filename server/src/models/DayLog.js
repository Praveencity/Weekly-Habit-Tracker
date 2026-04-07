import mongoose from "mongoose";

const dayLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    weekday: {
      type: String,
      required: true,
      trim: true,
    },
    completedTaskIds: {
      type: [String],
      default: [],
    },
    totalTasks: {
      type: Number,
      default: 0,
    },
    completedCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["none", "partial", "complete"],
      default: "none",
    },
  },
  {
    timestamps: true,
  }
);

dayLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("DayLog", dayLogSchema);
