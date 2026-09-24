"use client";

import {
  commentSchema,
  contentCardSchema,
  contentDetailSchema,
  createCommentSchema,
  updateContentSchema,
  type Comment,
  type ContentDetail,
} from "@maia-hub/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/components/layout/app-shell";
import { ContentCard } from "@/components/content/content-card";
import { apiFetch, readApiError } from "@/lib/api";
import { formatWhen } from "@/lib/format";

const fieldClass = "field";

export function ContentScreen({ contentId }: { contentId: string }) {
  const router = useRouter();
  const { user } = useSession();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const response = await apiFetch(`/contents/${contentId}`);
      if (!active) {
        return;
      }
      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }
      const parsed = contentDetailSchema.safeParse(await response.json());
      if (!parsed.success) {
        setContent(null);
        setError("Não foi possível ler o conteúdo");
        return;
      }
      setContent(parsed.data);
      setTitle(parsed.data.title ?? "");
      setText(parsed.data.body);
      setExternalLink(parsed.data.externalLink ?? "");
      setError(null);
      if (new URLSearchParams(window.location.search).get("editar") === "1") {
        setEditing(true);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [contentId]);

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content) {
      return;
    }
    const parsed = updateContentSchema.safeParse({ title, body: text, externalLink });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setSaving(true);
    const response = await apiFetch(`/contents/${content.id}`, {
      method: "PATCH",
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);
    if (!response.ok) {
      setError(await readApiError(response));
      return;
    }
    const updated = contentCardSchema.safeParse(await response.json());
    if (!updated.success) {
      setError("Não foi possível ler o conteúdo");
      return;
    }
    setContent({ ...content, ...updated.data, comments: content.comments });
    setEditing(false);
    setError(null);
  }

  async function removeComment(commentId: string) {
    if (!window.confirm("Apagar este recado?")) {
      return;
    }
    const response = await apiFetch(`/comments/${commentId}`, { method: "DELETE" });
    if (!response.ok) {
      setError(await readApiError(response));
      return;
    }
    setContent((current) =>
      current
        ? {
            ...current,
            commentCount: Math.max(0, current.commentCount - 1),
            comments: current.comments.filter((comment) => comment.id !== commentId),
          }
        : current,
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content) {
      return;
    }
    const parsed = createCommentSchema.safeParse({ body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setPending(true);
    const response = await apiFetch(`/contents/${content.id}/comments`, {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setPending(false);
    if (!response.ok) {
      setError(await readApiError(response));
      return;
    }
    const comment = commentSchema.safeParse(await response.json());
    if (!comment.success) {
      return;
    }
    setContent({
      ...content,
      commentCount: content.commentCount + 1,
      comments: [...content.comments, comment.data],
    });
    setBody("");
    setError(null);
  }

  if (!content) {
    return <p className="empty-note">{error ?? "Carregando..."}</p>;
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <ContentCard
        content={content}
        onChange={(next) => setContent({ ...content, ...next, comments: content.comments })}
        onEdit={() => setEditing(true)}
        onRemove={() => router.push("/")}
      />
      {editing ? (
        <form onSubmit={(event) => void saveEdit(event)} className="form-card">
          <h2 className="text-lg font-semibold">Editar trabalho</h2>
          <label className="flex flex-col gap-1 text-sm">
            Título
            <input value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Texto
            <textarea value={text} onChange={(event) => setText(event.target.value)} rows={6} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Link externo
            <input value={externalLink} onChange={(event) => setExternalLink(event.target.value)} className={fieldClass} />
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="primary-button"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="filter-button">
              Cancelar
            </button>
          </div>
        </form>
      ) : null}
      <h2 className="text-lg font-semibold">Recados</h2>
      <div className="flex flex-col gap-3">
        {content.comments.map((comment: Comment) => {
          const canDelete = user?.id === comment.author.id || user?.id === content.author.id;
          return (
            <article key={comment.id} className="recado-card">
              <header>
                <p>{comment.author.name}</p>
                {canDelete ? (
                  <button type="button" className="danger" onClick={() => void removeComment(comment.id)}>
                    Apagar
                  </button>
                ) : null}
              </header>
              <p>{comment.body}</p>
              <span>{formatWhen(comment.createdAt)}</span>
            </article>
          );
        })}
      </div>
      {user ? (
        <form onSubmit={(event) => void onSubmit(event)} className="form-card">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            placeholder="Deixe um recado"
            className="field"
          />
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" disabled={pending} className="mini-publish">
            {pending ? "Enviando..." : "Deixar recado"}
          </button>
        </form>
      ) : (
        <p className="empty-note">Entre para deixar um recado.</p>
      )}
    </section>
  );
}

