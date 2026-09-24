import type { ErrorRequestHandler } from "express";
import { HttpError } from "../lib/auth-error.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof HttpError) {
    response.status(error.status).json({ message: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({ message: "Erro interno" });
};
