export const tokens = {
  bg: "#000000",
  surface: "#1A1A1A",
  surface2: "#121212",
  glass: "rgba(26,26,26,0.55)",
  textPrimary: "#F5F5F5",
  textMuted: "#A0A0A0",
  gold: "#C9A227",
  goldSoft: "rgba(201,162,39,0.18)",
  goldFaint: "rgba(201,162,39,0.08)",
  radiusWidget: 24,
  radiusCard: 18,
  radiusChip: 12
} as const;

export type TokenKey = keyof typeof tokens;
