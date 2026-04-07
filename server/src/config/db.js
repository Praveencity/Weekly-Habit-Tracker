import mongoose from "mongoose";

export const connectDatabase = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      (process.env.NODE_ENV === "production"
        ? ""
        : "mongodb://127.0.0.1:27017/daytask");

    if (!mongoUri) {
      throw new Error("MONGODB_URI is required in production");
    }

    const connection = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};
