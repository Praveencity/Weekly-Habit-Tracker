import mongoose from "mongoose";

const dayDatabaseItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    type: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "Task",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 400,
      default: "",
    },
    done: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const dayDatabaseSchema = new mongoose.Schema(
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
    title: {
      type: String,
      trim: true,
      maxlength: 140,
      default: "",
    },
    items: {
      type: [dayDatabaseItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

dayDatabaseSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("DayDatabase", dayDatabaseSchema);
