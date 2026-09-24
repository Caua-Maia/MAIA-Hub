import {
  commentSchema,
  contentCardSchema,
  contentDetailSchema,
  createCommentSchema,
  createContentSchema,
  updateContentSchema,
} from "@maia-hub/shared";
import type { Request, Response } from "express";
import { routeParam } from "../lib/route-param.js";
import {
  addComment,
  createContent,
  deleteComment,
  deleteContent,
  getCommentAccess,
  getContent,
  getContentAccess,
  likeContent,
  listFeed,
  unlikeContent,
  updateContent,
} from "../services/content.service.js";

function viewerId(request: Request) {
  return request.user?.id ?? null;
}

export async function createContentController(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  const parsed = createContentSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: parsed.error.issues[0]?.message ?? "Dados inválidos" });
    return;
  }

  const content = await createContent(request.user.id, parsed.data);
  response.status(201).json(contentCardSchema.parse(content));
}

export async function feedController(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  const items = await listFeed(request.user.id);
  response.json(items.map((item) => contentCardSchema.parse(item)));
}

export async function contentController(request: Request, response: Response) {
  const content = await getContent(routeParam(request.params.id), viewerId(request));
  response.json(contentDetailSchema.parse(content));
}

export async function likeController(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  response.json(await likeContent(request.user.id, routeParam(request.params.id)));
}

export async function unlikeController(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  response.json(await unlikeContent(request.user.id, routeParam(request.params.id)));
}

export async function commentController(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  const parsed = createCommentSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: parsed.error.issues[0]?.message ?? "Dados inválidos" });
    return;
  }

  const comment = await addComment(request.user.id, routeParam(request.params.id), parsed.data);
  response.status(201).json(commentSchema.parse(comment));
}

export async function updateContentController(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  const parsed = updateContentSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: parsed.error.issues[0]?.message ?? "Dados inválidos" });
    return;
  }

  const content = await getContentAccess(routeParam(request.params.id));
  if (content.authorId !== request.user.id) {
    response.status(403).json({ message: "Sem permissão para editar este conteúdo" });
    return;
  }

  const updated = await updateContent(content.id, request.user.id, parsed.data);
  response.json(contentCardSchema.parse(updated));
}

export async function deleteContentController(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  const content = await getContentAccess(routeParam(request.params.id));
  if (content.authorId !== request.user.id) {
    response.status(403).json({ message: "Sem permissão para apagar este conteúdo" });
    return;
  }

  await deleteContent(content.id);
  response.status(204).send();
}

export async function deleteCommentController(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  const comment = await getCommentAccess(routeParam(request.params.id));
  const isCommentAuthor = comment.userId === request.user.id;
  const isContentAuthor = comment.content.authorId === request.user.id;
  if (!isCommentAuthor && !isContentAuthor) {
    response.status(403).json({ message: "Sem permissão para apagar este comentário" });
    return;
  }

  await deleteComment(comment.id);
  response.status(204).send();
}
