"use client";

import { loginSchema, registerSchema } from "@maia-hub/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, readApiError } from "@/lib/api";

type AuthFormProps = {
  mode: "register" | "login";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload = isRegister ? { name, email, password } : { email, password };
    const parsed = (isRegister ? registerSchema : loginSchema).safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setPending(true);
    const response = await apiFetch(isRegister ? "/auth/register" : "/auth/login", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setPending(false);

    if (!response.ok) {
      setError(await readApiError(response));
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      {isRegister ? (
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Nome
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            className="field"
          />
        </label>
      ) : null}
      <label className="flex flex-col gap-1 text-sm font-semibold">
        E-mail
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className="field"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Senha
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={isRegister ? "new-password" : "current-password"}
          className="field"
        />
      </label>
      {error ? <p className="error-text">{error}</p> : null}
      <button type="submit" disabled={pending} className="primary-button">
        {pending ? "Enviando..." : isRegister ? "Criar conta" : "Entrar"}
      </button>
      <p className="text-sm text-neutral-500">
        {isRegister ? (
          <Link href="/entrar">Já tenho conta</Link>
        ) : (
          <Link href="/cadastro">Criar conta</Link>
        )}
      </p>
    </form>
  );
}
