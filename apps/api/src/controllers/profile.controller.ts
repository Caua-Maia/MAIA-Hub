import {
  profileSchema,
  updateProfileSchema,
  type Creator,
} from "@maia-hub/shared";
import type { Request, Response } from "express";
import {
  followUser,
  getProfile,
  listSkills,
  searchCreators,
  unfollowUser,
  updateProfile,
} from "../services/profile.service.js";
import { listContentsByAuthor } from "../services/content.service.js";
import { routeParam } from "../lib/route-param.js";

function viewerId(request: Request) {
  return request.user?.id ?? null;
}

export async function myProfileController(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  response.json(profileSchema.parse(await getProfile(request.user.id, request.user.id)));
}

export async function profileController(request: Request, response: Response) {
  const profile = await getProfile(routeParam(request.params.id), viewerId(request));
  response.json(profileSchema.parse(profile));
}

export async function updateProfileController(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  const parsed = updateProfileSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: parsed.error.issues[0]?.message ?? "Dados inválidos" });
    return;
  }

  const profile = await updateProfile(request.user.id, parsed.data);
  response.json(profileSchema.parse(profile));
}

export async function skillsController(_request: Request, response: Response) {
  response.json(await listSkills());
}

export async function creatorsController(request: Request, response: Response) {
  const skillId = typeof request.query.skillId === "string" ? request.query.skillId : "";
  if (!skillId) {
    response.status(400).json({ message: "Escolha uma habilidade" });
    return;
  }

  const creators: Creator[] = await searchCreators(skillId);
  response.json(creators);
}

export async function followController(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  await followUser(request.user.id, routeParam(request.params.id));
  response.json({ isFollowing: true });
}

export async function unfollowController(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  await unfollowUser(request.user.id, routeParam(request.params.id));
  response.json({ isFollowing: false });
}

export async function authorContentsController(request: Request, response: Response) {
  response.json(await listContentsByAuthor(routeParam(request.params.id), viewerId(request)));
}
