import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  registerController,
} from "../controllers/auth.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { requireAuth } from "../middlewares/require-auth.js";

export const authRouter = Router();

authRouter.post("/auth/register", asyncHandler(registerController));
authRouter.post("/auth/login", asyncHandler(loginController));
authRouter.post("/auth/logout", logoutController);
authRouter.get("/auth/me", asyncHandler(requireAuth), meController);
