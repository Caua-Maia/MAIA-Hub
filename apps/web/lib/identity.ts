const tones = ["orange", "blue", "pink", "yellow", "purple", "green"] as const;

export type Tone = (typeof tones)[number];

export function tone(name: string): Tone {
  const index = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return tones[index % tones.length];
}

export function communityClass(name: string) {
  return `skill-pill pill-${tone(name)}`;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "M";
}
