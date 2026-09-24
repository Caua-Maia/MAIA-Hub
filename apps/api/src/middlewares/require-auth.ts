import type { NextFunction, Request, Response } from "express";
import type { PublicUser } from "@maia-hub/shared";
import { accessTokenCookie } from "../lib/auth-cookie.js";
import { readAccessToken } from "../lib/token.js";
import { findUserById } from "../services/auth.service.js";

export async function resolveRequestUser(request: Request): Promise<PublicUser | null> {
  const token = request.cookies?.[accessTokenCookie];
  if (typeof token !== "string" || token.length === 0) {
    return null;
  }

  try {
    const userId = await readAccessToken(token);
    return findUserById(userId);
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const user = await resolveRequestUser(request);
  if (!user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  request.user = user;
  next();
}

export async function optionalAuth(request: Request, _response: Response, next: NextFunction) {
  const user = await resolveRequestUser(request);
  if (user) {
    request.user = user;
  }
  next();
}
