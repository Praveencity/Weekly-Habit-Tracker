export const notFound = (request, response, next) => {
  const error = new Error(`Not found - ${request.originalUrl}`);
  response.status(404);
  next(error);
};

export const errorHandler = (error, request, response, next) => {
  const isDatabaseDisconnectedError =
    typeof error?.message === "string" &&
    (error.message.includes("before initial connection is complete") ||
      error.message.includes("MongoDB connection failed"));

  const statusCode = isDatabaseDisconnectedError
    ? 503
    : response.statusCode === 200
      ? 500
      : response.statusCode;

  const message = isDatabaseDisconnectedError
    ? "Database is temporarily unavailable. Please try again in a moment."
    : error.message;

  response.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
};
