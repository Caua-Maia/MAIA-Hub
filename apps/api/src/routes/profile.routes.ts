import { Router } from "express";
import {
  authorContentsController,
  creatorsController,
  followController,
  myProfileController,
  profileController,
  skillsController,
  unfollowController,
  updateProfileController,
} from "../controllers/profile.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { optionalAuth, requireAuth } from "../middlewares/require-auth.js";

export const profileRouter = Router();

profileRouter.get("/skills", asyncHandler(skillsController));
profileRouter.get("/creators", asyncHandler(creatorsController));
profileRouter.get("/users/me", requireAuth, asyncHandler(myProfileController));
profileRouter.patch("/users/me", requireAuth, asyncHandler(updateProfileController));
profileRouter.get("/users/:id", optionalAuth, asyncHandler(profileController));
profileRouter.get("/users/:id/contents", optionalAuth, asyncHandler(authorContentsController));
profileRouter.post("/users/:id/follow", requireAuth, asyncHandler(followController));
profileRouter.delete("/users/:id/follow", requireAuth, asyncHandler(unfollowController));
