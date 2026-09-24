"use client";

import {
  contentCardSchema,
  profileSchema,
  type ContentCard as ContentItem,
  type Profile,
} from "@maia-hub/shared";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { ContentCard } from "@/components/content/content-card";
import { apiFetch, readApiError } from "@/lib/api";
import { communityClass } from "@/lib/identity";

export function ProfileScreen({ userId }: { userId: string }) {
  const { user } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const [profileResponse, contentsResponse] = await Promise.all([
        apiFetch(`/users/${userId}`),
        apiFetch(`/users/${userId}/contents`),
      ]);
      if (!active) {
        return;
      }
      if (!profileResponse.ok) {
        setError(await readApiError(profileResponse));
        return;
      }

      const parsedProfile = profileSchema.safeParse(await profileResponse.json());
      const parsedContents = contentCardSchema.array().safeParse(await contentsResponse.json());
      setProfile(parsedProfile.success ? parsedProfile.data : null);
      setItems(parsedContents.success ? parsedContents.data : []);
      setError(parsedProfile.success ? null : "Não foi possível ler o perfil");
    }

    void load();
    return () => {
      active = false;
    };
  }, [userId, user?.id]);

  async function toggleFollow() {
    if (!profile || !user) {
      return;
    }
    setPending(true);
    const response = await apiFetch(`/users/${profile.id}/follow`, {
      method: profile.isFollowing ? "DELETE" : "POST",
    });
    setPending(false);
    if (!response.ok) {
      setError(await readApiError(response));
      return;
    }
    setProfile({
      ...profile,
      isFollowing: !profile.isFollowing,
      followersCount: profile.followersCount + (profile.isFollowing ? -1 : 1),
    });
  }

  if (error && !profile) {
    return <p className="empty-note">{error}</p>;
  }

  if (!profile) {
    return <p className="empty-note">Carregando perfil...</p>;
  }

  return (
    <section>
      <article className="profile-card profile-page">
        <div className="profile-cover">
          <div className="cover-orb orb-one" />
          <div className="cover-orb orb-two" />
        </div>
        <div className="profile-body">
          <div className="profile-top">
            <div className="profile-avatar-wrap">
              <Avatar name={profile.name} url={profile.avatarUrl} />
            </div>
            {profile.isSelf ? (
              <Link href="/perfil/editar" className="primary-button">
                Editar perfil
              </Link>
            ) : user ? (
              <button type="button" className="primary-button" onClick={() => void toggleFollow()} disabled={pending}>
                {profile.isFollowing ? "Seguindo" : "Adicionar"}
              </button>
            ) : (
              <Link href="/entrar" className="primary-button">
                Entrar para seguir
              </Link>
            )}
          </div>
          <h2>{profile.name}</h2>
          {profile.bio ? <p className="profile-role">{profile.bio}</p> : null}
          <div className="profile-numbers">
            <span>
              <b>{profile.followersCount}</b>
              <small>seguidores</small>
            </span>
            <span>
              <b>{profile.followingCount}</b>
              <small>seguindo</small>
            </span>
          </div>
          <div>
            {profile.skills.map((skill) => (
              <Link key={skill.id} href={`/buscar?skillId=${skill.id}`} className={communityClass(skill.name)}>
                {skill.name}
              </Link>
            ))}
          </div>
          {error ? <p className="error-text">{error}</p> : null}
        </div>
      </article>
      <div className="section-heading">
        <div>
          <h2>Trabalhos</h2>
        </div>
      </div>
      {items.length === 0 ? <p className="empty-note">Nenhum trabalho publicado.</p> : null}
      {items.map((item) => (
        <ContentCard
          key={item.id}
          content={item}
          onChange={(next) => setItems((current) => current.map((entry) => (entry.id === next.id ? next : entry)))}
          onRemove={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
        />
      ))}
    </section>
  );
}
