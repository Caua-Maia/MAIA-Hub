import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middlewares/error-handler.js";
import { router } from "./routes/index.js";

const localOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

function allowedOrigins() {
  const configured = (process.env.WEB_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return [...localOrigins, ...configured];
}

export const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins().includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origem não permitida"));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(router);
app.use(errorHandler);
