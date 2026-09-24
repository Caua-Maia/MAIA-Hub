import { AppShell } from "@/components/layout/app-shell";
import { FeedScreen } from "@/components/feed/feed-screen";

export default function Home() {
  return (
    <AppShell>
      <FeedScreen />
    </AppShell>
  );
}
