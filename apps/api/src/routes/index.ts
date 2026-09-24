import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { contentRouter } from "./content.routes.js";
import { healthRouter } from "./health.routes.js";
import { notificationRouter } from "./notification.routes.js";
import { profileRouter } from "./profile.routes.js";

export const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(contentRouter);
router.use(notificationRouter);
