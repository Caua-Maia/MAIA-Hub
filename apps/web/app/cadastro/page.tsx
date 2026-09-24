import { appName } from "@maia-hub/shared";
import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <p className="eyebrow">{appName}</p>
        <h1>Seu perfil, suas comunidades, seu mural.</h1>
        <p>Mostre o trabalho e deixe recados para quem cria com você.</p>
      </section>
      <section className="auth-panel">
        <h2>Criar conta</h2>
        <AuthForm mode="register" />
      </section>
    </main>
  );
}
