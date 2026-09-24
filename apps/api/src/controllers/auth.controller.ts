import { loginSchema, publicUserSchema, registerSchema } from "@maia-hub/shared";
import type { Request, Response } from "express";
import { clearAccessTokenCookie, setAccessTokenCookie } from "../lib/auth-cookie.js";
import { signAccessToken } from "../lib/token.js";
import { loginUser, registerUser } from "../services/auth.service.js";

export async function registerController(request: Request, response: Response) {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Dados inválidos" });
    return;
  }

  const user = await registerUser(parsed.data);
  const token = await signAccessToken(user.id);
  setAccessTokenCookie(response, token);
  response.status(201).json(publicUserSchema.parse(user));
}

export async function loginController(request: Request, response: Response) {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Dados inválidos" });
    return;
  }

  const user = await loginUser(parsed.data);
  const token = await signAccessToken(user.id);
  setAccessTokenCookie(response, token);
  response.json(publicUserSchema.parse(user));
}

export function logoutController(_request: Request, response: Response) {
  clearAccessTokenCookie(response);
  response.status(204).send();
}

export function meController(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  response.json(publicUserSchema.parse(request.user));
}
