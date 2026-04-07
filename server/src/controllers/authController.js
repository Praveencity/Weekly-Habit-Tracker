import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

const createToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || "daytask-secret", {
    expiresIn: "7d",
  });

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

const ensureDatabaseConnected = (response) => {
  // readyState: 1 = connected
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({ message: "Database is temporarily unavailable. Please try again in a moment." });
    return false;
  }

  return true;
};

export const register = async (request, response, next) => {
  try {
    if (!ensureDatabaseConnected(response)) return;

    const name = String(request.body.name || "").trim();
    const email = String(request.body.email || "").trim().toLowerCase();
    const password = String(request.body.password || "");

    if (!name || !email || password.length < 6) {
      return response.status(400).json({ message: "Provide name, email, and a 6+ character password" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return response.status(400).json({ message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    const token = createToken(user._id);

    response.status(201).json({ token, user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const login = async (request, response, next) => {
  try {
    if (!ensureDatabaseConnected(response)) return;

    const email = String(request.body.email || "").trim().toLowerCase();
    const password = String(request.body.password || "");

    if (!email || !password) {
      return response.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return response.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return response.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken(user._id);
    response.json({ token, user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const me = async (request, response) => {
  response.json({ user: serializeUser(request.user) });
};
