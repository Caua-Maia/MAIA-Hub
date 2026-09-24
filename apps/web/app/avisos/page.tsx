"use client";

import { AppShell } from "@/components/layout/app-shell";
import { NoticesScreen } from "@/components/notices/notices-screen";

export default function NoticesPage() {
  return (
    <AppShell>
      <NoticesScreen />
    </AppShell>
  );
}
