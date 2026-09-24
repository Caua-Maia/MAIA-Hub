"use client";

import { creatorSchema, skillSchema, type Creator, type Skill } from "@maia-hub/shared";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, readApiError } from "@/lib/api";
import { communityClass } from "@/lib/identity";
import { Avatar } from "@/components/ui/avatar";

export function SearchScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const skillId = params.get("skillId") ?? "";
  const query = (params.get("q") ?? "").trim().toLowerCase();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadSkills() {
      const response = await apiFetch("/skills");
      if (!active || !response.ok) {
        return;
      }
      const parsed = skillSchema.array().safeParse(await response.json());
      if (parsed.success) {
        setSkills(parsed.data);
      }
    }
    void loadSkills();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!skillId) {
      setCreators([]);
      return;
    }

    let active = true;
    async function loadCreators() {
      const response = await apiFetch(`/creators?skillId=${encodeURIComponent(skillId)}`);
      if (!active) {
        return;
      }
      if (!response.ok) {
        setError(await readApiError(response));
        setCreators([]);
        return;
      }
      const parsed = creatorSchema.array().safeParse(await response.json());
      setCreators(parsed.success ? parsed.data : []);
      setError(parsed.success ? null : "Não foi possível buscar");
    }
    void loadCreators();
    return () => {
      active = false;
    };
  }, [skillId]);

  const visibleSkills = skills.filter(
    (skill) => query.length === 0 || skill.name.toLowerCase().includes(query),
  );

  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>Comunidades</h2>
          <p>Encontre criadores pela habilidade, no estilo das comunidades.</p>
        </div>
      </div>
      <div className="skill-chooser">
        {visibleSkills.map((skill) => {
          const selected = skill.id === skillId;
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => router.push(selected ? "/buscar" : `/buscar?skillId=${skill.id}`)}
              className={selected ? "skill-pill is-selected" : communityClass(skill.name)}
            >
              {skill.name}
            </button>
          );
        })}
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      {visibleSkills.length === 0 ? <p className="empty-note">Nenhuma habilidade com esse nome.</p> : null}
      {skillId && creators.length === 0 && !error ? (
        <p className="empty-note">Ninguém nessa comunidade ainda.</p>
      ) : null}
      <div className="people-card" style={{ marginTop: 18 }}>
        {creators.map((creator) => (
          <Link key={creator.id} href={`/perfil/${creator.id}`} className="person-row">
            <Avatar name={creator.name} url={creator.avatarUrl} small />
            <span className="person-info">
              <b>{creator.name}</b>
              <span>{creator.bio || "Criador no MAIA Hub"}</span>
              <span>
                {creator.skills.map((skill) => (
                  <span key={skill.id} className={communityClass(skill.name)}>
                    {skill.name}
                  </span>
                ))}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
