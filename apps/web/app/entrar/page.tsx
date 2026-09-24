import { appName } from "@maia-hub/shared";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <p className="eyebrow">{appName}</p>
        <h1>Bem-vindo de volta ao mural.</h1>
        <p>Entre para publicar, seguir criadores e ver os recados da sua rede.</p>
      </section>
      <section className="auth-panel">
        <h2>Entrar</h2>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
