import type {
  ContentCard,
  ContentDetail,
  CreateCommentInput,
  CreateContentInput,
  UpdateContentInput,
} from "@maia-hub/shared";
import { Prisma, type ContentType } from "@prisma/client";
import { HttpError } from "../lib/auth-error.js";
import { prisma } from "../lib/prisma.js";
import { notify } from "./notification.service.js";

function contentInclude(viewerId: string | null) {
  return {
    author: { select: { id: true, name: true, avatarUrl: true } },
    images: { orderBy: { order: "asc" as const } },
    _count: { select: { likes: true, comments: true } },
    likes: {
      where: { userId: viewerId ?? "" },
      select: { id: true },
      take: 1,
    },
  } satisfies Prisma.ContentInclude;
}

type ContentRecord = Prisma.ContentGetPayload<{ include: ReturnType<typeof contentInclude> }>;

function toContentCard(content: ContentRecord): ContentCard {
  return {
    id: content.id,
    type: content.type,
    title: content.title,
    body: content.body,
    externalLink: content.externalLink,
    createdAt: content.createdAt.toISOString(),
    author: content.author,
    images: content.images,
    likeCount: content._count.likes,
    commentCount: content._count.comments,
    likedByMe: content.likes.length > 0,
  };
}

async function requireContent(contentId: string) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { id: true, authorId: true },
  });
  if (!content) {
    throw new HttpError(404, "Conteúdo não encontrado");
  }
  return content;
}

export async function createContent(authorId: string, input: CreateContentInput) {
  const content = await prisma.content.create({
    data: {
      authorId,
      type: input.type as ContentType,
      title: input.title.length > 0 ? input.title : null,
      body: input.body,
      externalLink: input.externalLink.length > 0 ? input.externalLink : null,
      images: {
        create: input.imageUrls.map((url, order) => ({ url, order })),
      },
    },
    include: contentInclude(authorId),
  });

  return toContentCard(content);
}

export async function getContentAccess(contentId: string) {
  return requireContent(contentId);
}

export async function updateContent(contentId: string, editorId: string, input: UpdateContentInput) {
  const content = await prisma.content.update({
    where: { id: contentId },
    data: {
      title: input.title.length > 0 ? input.title : null,
      body: input.body,
      externalLink: input.externalLink.length > 0 ? input.externalLink : null,
    },
    include: contentInclude(editorId),
  });

  return toContentCard(content);
}

export async function deleteContent(contentId: string) {
  await prisma.content.delete({ where: { id: contentId } });
}

export async function getCommentAccess(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      content: { select: { authorId: true } },
    },
  });

  if (!comment) {
    throw new HttpError(404, "Comentário não encontrado");
  }

  return comment;
}

export async function deleteComment(commentId: string) {
  await prisma.comment.delete({ where: { id: commentId } });
}

export async function listFeed(viewerId: string) {
  const follows = await prisma.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  });
  const authorIds = [viewerId, ...follows.map((follow) => follow.followingId)];
  const contents = await prisma.content.findMany({
    where: { authorId: { in: authorIds } },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: contentInclude(viewerId),
  });

  return contents.map(toContentCard);
}

export async function listContentsByAuthor(authorId: string, viewerId: string | null) {
  const author = await prisma.user.findUnique({ where: { id: authorId }, select: { id: true } });
  if (!author) {
    throw new HttpError(404, "Perfil não encontrado");
  }

  const contents = await prisma.content.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: contentInclude(viewerId),
  });

  return contents.map(toContentCard);
}

export async function getContent(contentId: string, viewerId: string | null): Promise<ContentDetail> {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      ...contentInclude(viewerId),
      comments: {
        orderBy: { createdAt: "asc" },
        take: 100,
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!content) {
    throw new HttpError(404, "Conteúdo não encontrado");
  }

  return {
    ...toContentCard(content),
    comments: content.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: comment.user,
    })),
  };
}

export async function likeContent(userId: string, contentId: string) {
  const content = await requireContent(contentId);
  try {
    await prisma.like.create({ data: { userId, contentId } });
    await notify({
      userId: content.authorId,
      actorId: userId,
      type: "like",
      contentId,
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
  }

  return likeState(userId, contentId);
}

export async function unlikeContent(userId: string, contentId: string) {
  await requireContent(contentId);
  await prisma.like.deleteMany({ where: { userId, contentId } });
  return likeState(userId, contentId);
}

async function likeState(userId: string, contentId: string) {
  const [likeCount, liked] = await Promise.all([
    prisma.like.count({ where: { contentId } }),
    prisma.like.findUnique({
      where: { userId_contentId: { userId, contentId } },
      select: { id: true },
    }),
  ]);

  return { likeCount, likedByMe: Boolean(liked) };
}

export async function addComment(userId: string, contentId: string, input: CreateCommentInput) {
  const content = await requireContent(contentId);
  const comment = await prisma.comment.create({
    data: { userId, contentId, body: input.body },
    include: { user: { select: { id: true, name: true } } },
  });
  await notify({
    userId: content.authorId,
    actorId: userId,
    type: "comment",
    contentId,
  });

  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    author: comment.user,
  };
}
