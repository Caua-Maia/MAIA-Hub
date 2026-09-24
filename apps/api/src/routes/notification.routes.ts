import { Router } from "express";
import {
  notificationsController,
  readNotificationsController,
} from "../controllers/notification.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { requireAuth } from "../middlewares/require-auth.js";

export const notificationRouter = Router();

notificationRouter.get("/notifications", requireAuth, asyncHandler(notificationsController));
notificationRouter.post("/notifications/read", requireAuth, asyncHandler(readNotificationsController));
