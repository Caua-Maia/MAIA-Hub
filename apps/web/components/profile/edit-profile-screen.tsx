"use client";

import { profileSchema, skillSchema, updateProfileSchema, type Skill } from "@maia-hub/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/components/layout/app-shell";
import { apiFetch, readApiError } from "@/lib/api";
import { communityClass } from "@/lib/identity";

const fieldClass = "field";

export function EditProfileScreen() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

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
      const [profileResponse, skillsResponse] = await Promise.all([
        apiFetch("/users/me"),
        apiFetch("/skills"),
      ]);
      if (!active) {
        return;
      }
      if (!profileResponse.ok) {
        setError(await readApiError(profileResponse));
        return;
      }
      const profile = profileSchema.safeParse(await profileResponse.json());
      const skillList = skillSchema.array().safeParse(await skillsResponse.json());
      if (!profile.success) {
        setError("Não foi possível ler o perfil");
        return;
      }
      setName(profile.data.name);
      setBio(profile.data.bio ?? "");
      setAvatarUrl(profile.data.avatarUrl ?? "");
      setSkillIds(profile.data.skills.map((skill) => skill.id));
      setSkills(skillList.success ? skillList.data : []);
      setReady(true);
    }
    void load();
    return () => {
      active = false;
    };
  }, [loading, user, router]);

  function toggleSkill(skillId: string) {
    setSkillIds((current) =>
      current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId].slice(0, 8),
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = updateProfileSchema.safeParse({ name, bio, avatarUrl, skillIds });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setPending(true);
    const response = await apiFetch("/users/me", {
      method: "PATCH",
      body: JSON.stringify(parsed.data),
    });
    setPending(false);
    if (!response.ok) {
      setError(await readApiError(response));
      return;
    }
    const profile = profileSchema.safeParse(await response.json());
    router.push(profile.success ? `/perfil/${profile.data.id}` : "/");
  }

  if (!ready) {
    return <p className="text-sm text-neutral-500">{error ?? "Carregando perfil..."}</p>;
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="form-card">
      <h1 className="text-2xl font-semibold tracking-tight">Editar perfil</h1>
      <label className="flex flex-col gap-1 text-sm">
        Nome
        <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Bio
        <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        URL do avatar
        <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} className={fieldClass} />
      </label>
      <fieldset className="skill-chooser">
        <legend className="text-sm font-semibold">Comunidades</legend>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => {
            const selected = skillIds.includes(skill.id);
            return (
              <label
                key={skill.id}
                className={selected ? "skill-pill is-selected" : communityClass(skill.name)}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selected}
                  onChange={() => toggleSkill(skill.id)}
                />
                {skill.name}
              </label>
            );
          })}
        </div>
      </fieldset>
      {error ? <p className="error-text">{error}</p> : null}
      <button type="submit" disabled={pending} className="primary-button">
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}

