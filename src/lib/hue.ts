export const HUES = [
  "mauve",
  "blue",
  "green",
  "peach",
  "teal",
  "yellow",
  "pink",
  "sapphire",
  "red",
  "lavender",
] as const;

export type Hue = (typeof HUES)[number];

export function hueForIndex(i: number): Hue {
  return HUES[((i % HUES.length) + HUES.length) % HUES.length];
}

export function hueVar(hue: Hue): string {
  return `var(--cat-${hue})`;
}
