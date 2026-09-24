import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SearchScreen } from "@/components/search/search-screen";

export default function SearchPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-sm text-neutral-500">Carregando busca...</p>}>
        <SearchScreen />
      </Suspense>
    </AppShell>
  );
}
