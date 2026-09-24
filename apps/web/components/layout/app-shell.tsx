"use client";

import { notificationSchema, publicUserSchema, type PublicUser } from "@maia-hub/shared";
import { Bell, Search, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/api";

type SessionValue = {
  user: PublicUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("Sessão indisponível");
  }
  return session;
}

const navItems = [
  { href: "/", label: "Início", icon: Sparkles },
  { href: "/buscar", label: "Buscar", icon: Search },
  { href: "/publicar", label: "Publicar", icon: Send },
  { href: "/avisos", label: "Avisos", icon: Bell },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [unread, setUnread] = useState(0);

  async function refresh() {
    const response = await apiFetch("/auth/me");
    if (!response.ok) {
      setUser(null);
      setLoading(false);
      return;
    }
    const parsed = publicUserSchema.safeParse(await response.json());
    setUser(parsed.success ? parsed.data : null);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    let active = true;
    async function loadNotices() {
      const response = await apiFetch("/notifications");
      if (!active || !response.ok) {
        return;
      }
      const parsed = notificationSchema.array().safeParse(await response.json());
      setUnread(parsed.success ? parsed.data.filter((item) => !item.read).length : 0);
    }
    void loadNotices();
    return () => {
      active = false;
    };
  }, [user, pathname]);

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/buscar?q=${encodeURIComponent(value)}` : "/buscar");
  }

  return (
    <SessionContext.Provider value={{ user, loading, refresh }}>
      <div className="app-shell">
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/">
              <span className="brand">
                <span className="brand-mark">M</span>
                <span>
                  MAIA <b>Hub</b>
                </span>
              </span>
            </Link>
            <form className="top-search" onSubmit={search}>
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar criadores ou habilidades"
                aria-label="Buscar criadores"
              />
            </form>
            {user ? (
              <nav className="main-nav" aria-label="Navegação principal">
                {navItems.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className={active ? "nav-item active" : "nav-item"}>
                      <Icon size={18} />
                      <span>{item.label}</span>
                      {item.href === "/avisos" && unread > 0 ? <i className="notification-dot">{unread}</i> : null}
                    </Link>
                  );
                })}
              </nav>
            ) : (
              <div className="guest-actions">
                <Link href="/entrar">Entrar</Link>
                <Link href="/cadastro" className="primary-button">
                  Criar conta
                </Link>
              </div>
            )}
            {user ? (
              <div className="top-profile">
                <Link href={`/perfil/${user.id}`} aria-label="Meu perfil">
                  <Avatar name={user.name} url={user.avatarUrl} small />
                </Link>
                <button type="button" onClick={() => void logout()} className="icon-button" aria-label="Sair">
                  Sair
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <div className="main-content">{children}</div>
      </div>
    </SessionContext.Provider>
  );
}
