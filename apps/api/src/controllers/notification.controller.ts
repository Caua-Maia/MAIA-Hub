import { notificationSchema } from "@maia-hub/shared";
import type { Request, Response } from "express";
import { listNotifications, markNotificationsRead } from "../services/notification.service.js";

export async function notificationsController(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  const notifications = await listNotifications(request.user.id);
  response.json(notifications.map((notification) => notificationSchema.parse(notification)));
}

export async function readNotificationsController(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: "Não autenticado" });
    return;
  }

  await markNotificationsRead(request.user.id);
  response.status(204).send();
}
