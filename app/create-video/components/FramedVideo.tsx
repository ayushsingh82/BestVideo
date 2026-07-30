import { FRAME_STYLES, frameInsetStyle, type FrameStyle } from "../frame";

/** Sprocket-hole row along the top and bottom border of the film-strip frame. */
export function FilmStripHoles() {
  const dots = Array.from({ length: 9 });
  return (
    <>
      <div className="absolute inset-x-0 top-[4%] flex justify-between px-[7%]">
        {dots.map((_, i) => (
          <span key={i} className="h-2 w-2 rounded-[2px] bg-neutral-50/80" />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-[4%] flex justify-between px-[7%]">
        {dots.map((_, i) => (
          <span key={i} className="h-2 w-2 rounded-[2px] bg-neutral-50/80" />
        ))}
      </div>
    </>
  );
}

/** Wraps the video in a preset border frame, thickness driven by borderPct. */
export function FramedVideo({
  src,
  frameStyle,
  borderPct,
}: {
  src: string;
  frameStyle: FrameStyle;
  borderPct: number;
}) {
  const preset = FRAME_STYLES.find((f) => f.id === frameStyle) ?? FRAME_STYLES[0];
  return (
    <div className={`relative h-full w-full ${preset.border}`}>
      {preset.id === "filmstrip" && <FilmStripHoles />}
      <div
        className={`absolute overflow-hidden ${preset.id === "polaroid" ? "shadow-md" : "shadow-inner"}`}
        style={frameInsetStyle(preset.id, borderPct)}
      >
        <video src={src} controls playsInline className="h-full w-full object-cover" />
      </div>
    </div>
  );
}
