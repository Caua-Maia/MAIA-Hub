import { initials, tone } from "@/lib/identity";

export function Avatar({
  name,
  url,
  small = false,
}: {
  name: string;
  url?: string | null;
  small?: boolean;
}) {
  const className = `avatar avatar-${tone(name)} ${small ? "avatar-small" : ""}`;

  if (url) {
    return (
      <div className={className}>
        {/* A foto vem de uma URL escolhida pelo usuário, fora do domínio do next/image. */}
        <img src={url} alt="" />
      </div>
    );
  }

  return <div className={className}>{initials(name)}</div>;
}
