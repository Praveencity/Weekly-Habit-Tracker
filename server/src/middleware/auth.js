import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (request, response, next) => {
  try {
    const header = request.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return response.status(401).json({ message: "Not authorized" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "daytask-secret");
    const user = await User.findById(payload.userId).select("name email");

    if (!user) {
      return response.status(401).json({ message: "Not authorized" });
    }

    request.user = user;
    next();
  } catch (error) {
    response.status(401).json({ message: "Not authorized" });
  }
};
