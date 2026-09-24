import type { Metadata } from "next";
import { appName } from "@maia-hub/shared";
import "./globals.css";

export const metadata: Metadata = {
  title: `${appName} — O mural dos criadores`,
  description: "Portfólio, comunidades de habilidade e recados para quem cria.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
