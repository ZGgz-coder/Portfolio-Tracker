import type { ConnectorType } from "@/types/domain";

export interface QuantumCardProps {
  title?: string;
  rightSlot?: React.ReactNode;
  glowVariant?: "gold";
  interactive?: boolean;
  disableGlow?: boolean;
  children: React.ReactNode;
}

export interface PrivacyNumberProps {
  value: number | string;
  format: "currency" | "percent" | "plain";
  defaultHidden?: boolean;
  size?: "sm" | "md" | "lg";
}

export interface SourceBadgeProps {
  type: ConnectorType;
}
