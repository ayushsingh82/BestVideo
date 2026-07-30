import type { CSSProperties } from "react";

export type FrameStyle =
  | "black"
  | "white"
  | "navy"
  | "sunset"
  | "ocean"
  | "berry"
  | "polaroid"
  | "filmstrip"
  | "stripes";

// Border thickness is user-controlled (see borderPct state in page.tsx) instead of fixed per preset.
// "polaroid" keeps a slightly deeper bottom for the classic look (see frameInsetStyle below).
export const FRAME_STYLES: { id: FrameStyle; label: string; border: string }[] = [
  // Single colors
  { id: "black", label: "Classic black", border: "bg-neutral-950" },
  { id: "white", label: "Clean white", border: "bg-white" },
  { id: "navy", label: "Navy", border: "bg-blue-950" },
  // Multicolor gradients
  { id: "sunset", label: "Sunset", border: "bg-gradient-to-br from-orange-400 via-rose-500 to-purple-600" },
  { id: "ocean", label: "Ocean", border: "bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-700" },
  { id: "berry", label: "Berry", border: "bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600" },
  // Designed frames — polaroid is a warm off-white (not plain white, so it reads distinct from
  // "Clean white" in the picker) and stripes is a 2-color hazard-tape pattern.
  { id: "polaroid", label: "Polaroid", border: "bg-stone-100" },
  { id: "filmstrip", label: "Film strip", border: "bg-neutral-950" },
  {
    id: "stripes",
    label: "Hazard",
    border: "bg-[repeating-linear-gradient(45deg,#0a0a0a_0px,#0a0a0a_14px,#facc15_14px,#facc15_28px)]",
  },
];

export const ASPECT_RATIOS: { id: string; label: string; value: string }[] = [
  { id: "16:9", label: "16:9", value: "16 / 9" },
  { id: "9:16", label: "9:16", value: "9 / 16" },
  { id: "1:1", label: "1:1", value: "1 / 1" },
  { id: "4:5", label: "4:5", value: "4 / 5" },
];

/** How far the border eats into the frame on the bottom edge (polaroid runs a bit deeper). */
export function frameBottomPct(id: FrameStyle, pct: number): number {
  return id === "polaroid" ? pct + 4 : pct;
}

/** Inset for the inner video window, in %, driven by the user's border-thickness slider. */
export function frameInsetStyle(id: FrameStyle, pct: number): CSSProperties {
  return { top: `${pct}%`, left: `${pct}%`, right: `${pct}%`, bottom: `${frameBottomPct(id, pct)}%` };
}
