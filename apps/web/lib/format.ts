export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function contentTypeLabel(type: "POST" | "PROJECT") {
  return type === "PROJECT" ? "Projeto" : "Post";
}
