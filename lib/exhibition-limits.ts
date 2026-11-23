import type { ExhibitionLimits } from "@/lib/types";

// Blank or non-positive means no limit. Stored to two decimals.
export function parseLimit(raw: string): number | null {
  const n = Math.round(Number(raw) * 100) / 100;
  return Number.isFinite(n) && n > 0 ? n : null;
}

// "Max H 150 × L 100 × W 20 cm", leaving out dimensions with no limit. Any
// free-text note from before the structured fields follows it.
export function sizeLabel(x: Pick<ExhibitionLimits, "maxHeightCm" | "maxLengthCm" | "maxWidthCm"> & { sizeRequirements: string }): string {
  const dims = ([["H", x.maxHeightCm], ["L", x.maxLengthCm], ["W", x.maxWidthCm]] as const)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k} ${v}`);
  return [dims.length ? `Max ${dims.join(" × ")} cm` : "", x.sizeRequirements].filter(Boolean).join(" · ");
}

export function weightLabel(x: Pick<ExhibitionLimits, "maxWeightExclPackagingKg" | "maxWeightInclPackagingKg">): string {
  return [
    x.maxWeightExclPackagingKg != null ? `Max ${x.maxWeightExclPackagingKg} kg excluding packaging` : "",
    x.maxWeightInclPackagingKg != null ? `Max ${x.maxWeightInclPackagingKg} kg including packaging / crating` : "",
  ].filter(Boolean).join(" · ");
}
