export const notFound = (request, response, next) => {
  const error = new Error(`Not found - ${request.originalUrl}`);
  response.status(404);
  next(error);
};

export const errorHandler = (error, request, response, next) => {
  const statusCode = response.statusCode === 200 ? 500 : response.statusCode;
  response.status(statusCode).json({
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
};
