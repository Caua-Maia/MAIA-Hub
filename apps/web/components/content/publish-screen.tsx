"use client";

import { contentCardSchema, createContentSchema } from "@maia-hub/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/components/layout/app-shell";
import { apiFetch, readApiError } from "@/lib/api";

const fieldClass = "field";

export function PublishScreen() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [type, setType] = useState<"POST" | "PROJECT">("PROJECT");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/entrar");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <p className="text-sm text-neutral-500">Carregando...</p>;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      type,
      title,
      body,
      externalLink,
      imageUrls: imageUrls
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    };
    const parsed = createContentSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setPending(true);
    const response = await apiFetch("/contents", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setPending(false);
    if (!response.ok) {
      setError(await readApiError(response));
      return;
    }
    const content = contentCardSchema.safeParse(await response.json());
    router.push(content.success ? `/conteudo/${content.data.id}` : "/");
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="form-card">
      <h1 className="text-2xl font-semibold tracking-tight">Publicar</h1>
      <label className="flex flex-col gap-1 text-sm">
        Tipo
        <select
          value={type}
          onChange={(event) => setType(event.target.value as "POST" | "PROJECT")}
          className={fieldClass}
        >
          <option value="PROJECT">Projeto</option>
          <option value="POST">Post</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Título
        <input value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Texto
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Link externo
        <input value={externalLink} onChange={(event) => setExternalLink(event.target.value)} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        URLs de imagem, uma por linha
        <textarea
          value={imageUrls}
          onChange={(event) => setImageUrls(event.target.value)}
          rows={3}
          className={fieldClass}
        />
      </label>
      {error ? <p className="error-text">{error}</p> : null}
      <button type="submit" disabled={pending} className="primary-button">
        {pending ? "Publicando..." : "Publicar"}
      </button>
    </form>
  );
}

