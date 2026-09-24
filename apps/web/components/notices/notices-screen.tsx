"use client";

import { notificationSchema, type AppNotification } from "@maia-hub/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/components/layout/app-shell";
import { apiFetch, readApiError } from "@/lib/api";
import { formatWhen } from "@/lib/format";

function notificationText(notification: AppNotification) {
  if (notification.type === "follow") {
    return `${notification.actor.name} começou a seguir você`;
  }
  if (notification.type === "like") {
    return `${notification.actor.name} curtiu seu trabalho`;
  }
  return `${notification.actor.name} deixou um recado no seu trabalho`;
}

function notificationHref(notification: AppNotification) {
  if (notification.contentId) {
    return `/conteudo/${notification.contentId}`;
  }
  return `/perfil/${notification.actor.id}`;
}

export function NoticesScreen() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.replace("/entrar");
      return;
    }

    let active = true;
    async function load() {
      const response = await apiFetch("/notifications");
      if (!active) {
        return;
      }
      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }
      const parsed = notificationSchema.array().safeParse(await response.json());
      setItems(parsed.success ? parsed.data : []);
      await apiFetch("/notifications/read", { method: "POST" });
    }
    void load();
    return () => {
      active = false;
    };
  }, [loading, user, router]);

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">Avisos</h1>
      {error ? <p className="error-text">{error}</p> : null}
      {items.length === 0 ? <p className="empty-note">Nenhum aviso por enquanto.</p> : null}
      {items.map((notification) => (
        <Link
          key={notification.id}
          href={notificationHref(notification)}
          className={`notice-card ${notification.type === "like" ? "notice-like" : ""} ${notification.type === "comment" ? "notice-comment" : ""}`}
        >
          <p>{notificationText(notification)}</p>
          <span>{formatWhen(notification.createdAt)}</span>
        </Link>
      ))}
    </section>
  );
}

