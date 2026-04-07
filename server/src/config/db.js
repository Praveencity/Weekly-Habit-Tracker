import mongoose from "mongoose";

let lastDbError = null;

export const getDatabaseDiagnostics = () => ({
  readyState: mongoose.connection.readyState,
  lastError: lastDbError,
});

export const connectDatabase = async () => {
  // Fail fast on queries when DB is unavailable instead of buffering for 10s+
  mongoose.set("bufferCommands", false);

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
    lastDbError = null;
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    lastDbError = error.message;
    console.error("MongoDB connection failed:", error.message);
  }
};
