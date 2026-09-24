import { Router } from "express";
import {
  commentController,
  contentController,
  createContentController,
  deleteCommentController,
  deleteContentController,
  feedController,
  likeController,
  unlikeController,
  updateContentController,
} from "../controllers/content.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { optionalAuth, requireAuth } from "../middlewares/require-auth.js";

export const contentRouter = Router();

contentRouter.get("/feed", requireAuth, asyncHandler(feedController));
contentRouter.post("/contents", requireAuth, asyncHandler(createContentController));
contentRouter.get("/contents/:id", optionalAuth, asyncHandler(contentController));
contentRouter.patch("/contents/:id", requireAuth, asyncHandler(updateContentController));
contentRouter.delete("/contents/:id", requireAuth, asyncHandler(deleteContentController));
contentRouter.post("/contents/:id/like", requireAuth, asyncHandler(likeController));
contentRouter.delete("/contents/:id/like", requireAuth, asyncHandler(unlikeController));
contentRouter.post("/contents/:id/comments", requireAuth, asyncHandler(commentController));
contentRouter.delete("/comments/:id", requireAuth, asyncHandler(deleteCommentController));
