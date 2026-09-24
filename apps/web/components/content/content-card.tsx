"use client";

import type { ContentCard as ContentItem } from "@maia-hub/shared";
import { ArrowRight, Heart, Link2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { apiFetch, readApiError } from "@/lib/api";
import { contentTypeLabel, formatWhen } from "@/lib/format";

export function ContentCard({
  content,
  onChange,
  onEdit,
  onRemove,
}: {
  content: ContentItem;
  onChange?: (content: ContentItem) => void;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const router = useRouter();
  const { user } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isAuthor = user?.id === content.author.id;

  async function toggleLike() {
    if (!user) {
      router.push("/entrar");
      return;
    }

    setPending(true);
    setError(null);
    const response = await apiFetch(`/contents/${content.id}/like`, {
      method: content.likedByMe ? "DELETE" : "POST",
    });
    setPending(false);

    if (!response.ok) {
      setError(await readApiError(response));
      return;
    }

    const body = (await response.json()) as { likeCount: number; likedByMe: boolean };
    onChange?.({ ...content, likeCount: body.likeCount, likedByMe: body.likedByMe });
  }

  async function removeContent() {
    if (!user) {
      router.push("/entrar");
      return;
    }
    if (!window.confirm("Apagar este trabalho? Curtidas e recados também somem.")) {
      return;
    }

    setPending(true);
    setError(null);
    const response = await apiFetch(`/contents/${content.id}`, { method: "DELETE" });
    setPending(false);
    if (!response.ok) {
      setError(await readApiError(response));
      return;
    }
    if (onRemove) {
      onRemove();
      return;
    }
    router.push("/");
  }

  return (
    <article className="post-card">
      <div className="post-head">
        <Avatar name={content.author.name} url={content.author.avatarUrl} small />
        <div className="post-meta">
          <Link href={`/perfil/${content.author.id}`}>{content.author.name}</Link>
          <span>{formatWhen(content.createdAt)}</span>
        </div>
        {isAuthor ? (
          <div className="owner-actions">
            <button type="button" onClick={() => (onEdit ? onEdit() : router.push(`/conteudo/${content.id}?editar=1`))}>
              Editar
            </button>
            <button type="button" className="danger" onClick={() => void removeContent()} disabled={pending}>
              Apagar
            </button>
          </div>
        ) : null}
      </div>
      <div className="post-type">
        <span className={`type-dot ${content.type === "PROJECT" ? "project-dot" : "post-dot"}`} />
        {contentTypeLabel(content.type)}
        <span className="post-date">{formatWhen(content.createdAt)}</span>
      </div>
      {content.title ? <h3>{content.title}</h3> : null}
      <p>{content.body}</p>
      {content.images.map((image) => (
        // URLs são informadas pelo autor e não estão no domínio do next/image.
        <img key={image.id} src={image.url} alt="" className="post-photo" />
      ))}
      {content.externalLink ? (
        <a className="external-link" href={content.externalLink} target="_blank" rel="noreferrer">
          <Link2 size={14} /> Abrir link do projeto <ArrowRight size={14} />
        </a>
      ) : null}
      <div className="post-stats">
        <span>
          {content.likeCount} {content.likeCount === 1 ? "curtida" : "curtidas"}
        </span>
        <span>
          {content.commentCount} {content.commentCount === 1 ? "recado" : "recados"}
        </span>
      </div>
      <div className="post-actions">
        <button type="button" className={content.likedByMe ? "active" : ""} onClick={() => void toggleLike()} disabled={pending}>
          <Heart size={18} fill={content.likedByMe ? "currentColor" : "none"} /> Curtir
        </button>
        <Link href={`/conteudo/${content.id}`}>
          <MessageCircle size={18} /> Recados <span className="action-count">{content.commentCount}</span>
        </Link>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
    </article>
  );
}
