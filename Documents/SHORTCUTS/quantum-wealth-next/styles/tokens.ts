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
  tealGlow:    "rgba(42,167,161,0.9)",
  tealFaint:   "rgba(42,167,161,0.08)",
  tealBorder:  "rgba(42,167,161,0.3)",
  coral:       "rgba(220,60,60,0.9)",
  coralFaint:  "rgba(220,60,60,0.08)",
  coralBorder: "rgba(220,60,60,0.22)",
  amber:       "rgba(224,122,63,0.9)",
  amberFaint:  "rgba(224,122,63,0.08)",
  amberBorder: "rgba(224,122,63,0.28)",
  radiusWidget: 24,
  radiusCard: 18,
  radiusChip: 12
} as const;

export type TokenKey = keyof typeof tokens;
