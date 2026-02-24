export type RangeKey = "1D" | "1W" | "1M" | "3M" | "YTD" | "1Y" | "ALL";

export type TimePoint = { t: string; v: number };

export type AllocationKind = "cash" | "stocks" | "crypto";

export type AllocationNode = {
  id: string;
  label: string;
  value: number;
  kind: AllocationKind;
  children?: AllocationNode[];
};
