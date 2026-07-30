export const FONT_COLORS = ["#FFFFFF", "#000000", "#FFE600", "#00E5A0", "#FF4D8D", "#4D8DFF"];
export const HIGHLIGHT_COLORS = ["#FFE600", "#00E5A0", "#FF4D8D", "#4D8DFF", "#FF8A00", "#A855F7"];

export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
