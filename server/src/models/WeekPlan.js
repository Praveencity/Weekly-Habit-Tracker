import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    time: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
    },
    startTime: {
      type: String,
      trim: true,
      maxlength: 5,
      default: "",
    },
    endTime: {
      type: String,
      trim: true,
      maxlength: 5,
      default: "",
    },
    type: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "General",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 240,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const weekPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    weekday: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    tasks: {
      type: [taskSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

weekPlanSchema.index({ userId: 1, weekday: 1 }, { unique: true });

export default mongoose.model("WeekPlan", weekPlanSchema);
