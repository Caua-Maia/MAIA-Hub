import type { AppNotification } from "@maia-hub/shared";
import { prisma } from "../lib/prisma.js";

type NotificationType = AppNotification["type"];

export async function notify(input: {
  userId: string;
  actorId: string;
  type: NotificationType;
  contentId?: string;
}) {
  if (input.userId === input.actorId) {
    return;
  }

  await prisma.notification.create({
    data: {
      userId: input.userId,
      actorId: input.actorId,
      type: input.type,
      contentId: input.contentId,
    },
  });
}

export async function listNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      actor: { select: { id: true, name: true } },
    },
  });

  return notifications.map((notification) => ({
    id: notification.id,
    type: notification.type as NotificationType,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
    contentId: notification.contentId,
    actor: notification.actor,
  }));
}

export async function markNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
