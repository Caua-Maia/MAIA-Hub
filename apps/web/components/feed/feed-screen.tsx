"use client";

import {
  contentCardSchema,
  creatorSchema,
  profileSchema,
  skillSchema,
  type ContentCard as ContentItem,
  type Creator,
  type Profile,
  type Skill,
} from "@maia-hub/shared";
import { demoAccount } from "@maia-hub/shared";
import { ArrowRight, Check, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { ContentCard } from "@/components/content/content-card";
import { apiFetch, readApiError } from "@/lib/api";
import { communityClass, tone } from "@/lib/identity";

const communityMarks = ["✦", "▧", "◒", "◈"];

export function FeedScreen() {
  const { user, loading, refresh } = useSession();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [people, setPeople] = useState<Creator[]>([]);
  const [followed, setFollowed] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [demoPending, setDemoPending] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    let active = true;

    async function loadFeed() {
      const [feedResponse, profileResponse, skillsResponse] = await Promise.all([
        apiFetch("/feed"),
        apiFetch("/users/me"),
        apiFetch("/skills"),
      ]);
      if (!active) {
        return;
      }
      if (!feedResponse.ok) {
        setError(await readApiError(feedResponse));
        setReady(true);
        return;
      }

      const parsed = contentCardSchema.array().safeParse(await feedResponse.json());
      const parsedProfile = profileSchema.safeParse(await profileResponse.json());
      const parsedSkills = skillSchema.array().safeParse(await skillsResponse.json());
      setItems(parsed.success ? parsed.data : []);
      setProfile(parsedProfile.success ? parsedProfile.data : null);
      setSkills(parsedSkills.success ? parsedSkills.data : []);
      setError(parsed.success ? null : "Não foi possível ler o feed");
      setReady(true);

      const firstSkill = parsedSkills.success ? parsedSkills.data[0] : undefined;
      if (!firstSkill) {
        return;
      }
      const creatorsResponse = await apiFetch(`/creators?skillId=${firstSkill.id}`);
      if (!active || !creatorsResponse.ok) {
        return;
      }
      const creators = creatorSchema.array().safeParse(await creatorsResponse.json());
      setPeople(
        creators.success ? creators.data.filter((creator) => creator.id !== user?.id).slice(0, 3) : [],
      );
    }

    void loadFeed();
    return () => {
      active = false;
    };
  }, [loading, user]);

  async function follow(personId: string) {
    const response = await apiFetch(`/users/${personId}/follow`, { method: "POST" });
    if (response.ok) {
      setFollowed((current) => [...current, personId]);
    }
  }

  async function enterDemo() {
    setDemoPending(true);
    setDemoError(null);
    const response = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: demoAccount.email,
        password: demoAccount.password,
      }),
    });
    setDemoPending(false);
    if (!response.ok) {
      setDemoError(await readApiError(response));
      return;
    }
    await refresh();
  }

  if (loading) {
    return <p className="empty-note">Carregando...</p>;
  }

  if (!user) {
    return (
      <section className="hero-card">
        <h1>MAIA Hub</h1>
        <p>O mural profissional dos criadores: portfólio, comunidades de habilidade e recados.</p>
        <div className="hero-actions">
          <button type="button" className="solid" onClick={() => void enterDemo()} disabled={demoPending}>
            {demoPending ? "Entrando..." : "Entrar para ver"}
          </button>
          <Link className="ghost" href="/cadastro">
            Criar conta
          </Link>
        </div>
        <p className="demo-note">
          Conta de visita: {demoAccount.email} · senha {demoAccount.password}
        </p>
        {demoError ? <p className="error-text">{demoError}</p> : null}
      </section>
    );
  }

  const firstName = user.name.split(" ")[0];
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  function replaceItem(next: ContentItem) {
    setItems((current) => current.map((item) => (item.id === next.id ? next : item)));
  }

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{today}</p>
          <h1>
            Bom dia, {firstName} <span>✦</span>
          </h1>
          <p className="welcome-sub">Descubra o que a sua rede está criando hoje.</p>
        </div>
        <Link href="/publicar" className="primary-button">
          <Sparkles size={17} /> Publicar trabalho
        </Link>
      </div>
      <div className="composer">
        <Avatar name={user.name} url={user.avatarUrl} small />
        <Link href="/publicar">O que você quer compartilhar hoje?</Link>
      </div>
      <div className="content-grid">
        <div className="feed-column">
          <div className="section-heading">
            <div>
              <h2>Seu mural</h2>
              <p>As novidades de quem você acompanha</p>
            </div>
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          {!ready ? <p className="empty-note">Carregando feed...</p> : null}
          {ready && items.length === 0 ? (
            <p className="empty-note">Seu mural está vazio. Publique um trabalho ou siga alguém em Buscar.</p>
          ) : null}
          {items.map((item) => (
            <ContentCard
              key={item.id}
              content={item}
              onChange={replaceItem}
              onRemove={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
            />
          ))}
        </div>
        <div className="right-column">
          <aside className="profile-card">
            <div className="profile-cover">
              <div className="cover-orb orb-one" />
              <div className="cover-orb orb-two" />
            </div>
            <div className="profile-body">
              <div className="profile-avatar-wrap">
                <Avatar name={user.name} url={user.avatarUrl} />
              </div>
              <h2>{user.name}</h2>
              <p className="profile-role">{profile?.bio || "Criador no MAIA Hub"}</p>
              <p className="profile-email">{user.email}</p>
              <div className="profile-divider" />
              <div className="profile-numbers">
                <span>
                  <b>{profile?.followersCount ?? 0}</b>
                  <small>seguidores</small>
                </span>
                <span>
                  <b>{profile?.followingCount ?? 0}</b>
                  <small>seguindo</small>
                </span>
              </div>
              <Link className="view-profile" href={`/perfil/${user.id}`}>
                Ver meu perfil <ArrowRight size={15} />
              </Link>
            </div>
          </aside>
          <section className="community-card">
            <div className="card-title">
              <div>
                <h3>Comunidades em alta</h3>
                <p>Encontre gente como você</p>
              </div>
              <Link href="/buscar">Ver todas</Link>
            </div>
            <div className="community-list">
              {skills.slice(0, 4).map((skill, index) => (
                <Link className="community-row" href={`/buscar?skillId=${skill.id}`} key={skill.id}>
                  <span className={`community-icon icon-${tone(skill.name)}`}>{communityMarks[index]}</span>
                  <span>
                    <b>{skill.name}</b>
                    <small>comunidade</small>
                  </span>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          </section>
          {people.length > 0 ? (
            <section className="people-card">
              <div className="card-title">
                <div>
                  <h3>Talvez você conheça</h3>
                  <p>Novas conexões para explorar</p>
                </div>
              </div>
              {people.map((person) => (
                <div className="person-row" key={person.id}>
                  <Avatar name={person.name} url={person.avatarUrl} small />
                  <div className="person-info">
                    <Link href={`/perfil/${person.id}`}>
                      <b>{person.name}</b>
                    </Link>
                    <span>{person.bio || person.skills[0]?.name}</span>
                    <div>
                      {person.skills.slice(0, 2).map((skill) => (
                        <span key={skill.id} className={communityClass(skill.name)}>
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="follow-button"
                    type="button"
                    aria-label={`Seguir ${person.name}`}
                    onClick={() => void follow(person.id)}
                  >
                    {followed.includes(person.id) ? <Check size={16} /> : <UserPlus size={16} />}
                  </button>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
