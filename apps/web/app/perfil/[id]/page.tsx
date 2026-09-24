"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileScreen } from "@/components/profile/profile-screen";

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = typeof params.id === "string" ? params.id : "";

  return (
    <AppShell>
      {userId ? <ProfileScreen userId={userId} /> : <p>Perfil inválido</p>}
    </AppShell>
  );
}
