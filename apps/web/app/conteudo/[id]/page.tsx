"use client";

import { useParams } from "next/navigation";
import { ContentScreen } from "@/components/content/content-screen";
import { AppShell } from "@/components/layout/app-shell";

export default function ContentPage() {
  const params = useParams<{ id: string }>();
  const contentId = typeof params.id === "string" ? params.id : "";

  return <AppShell>{contentId ? <ContentScreen contentId={contentId} /> : null}</AppShell>;
}
