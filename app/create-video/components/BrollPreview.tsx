"use client";

import { useEffect, useRef, useState } from "react";
import type { Cue } from "../types";

/**
 * Plays the user's ORIGINAL video and overlays a relevant photo on the top 30%
 * of the frame, switching as the playhead moves through the keyword cues.
 */
export function BrollPreview({ src, cues }: { src: string; cues: Cue[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState<Cue | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      const t = v.currentTime;
      setCurrent(cues.find((c) => t >= c.start && t < c.end) ?? null);
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [cues]);

  return (
    <div className="relative mx-auto aspect-[9/16] max-h-[72vh] w-full overflow-hidden bg-black">
      <video ref={videoRef} src={src} controls playsInline className="h-full w-full object-contain" />
      {current && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[30%] bg-black">
          <img
            key={current.imageUrl}
            src={current.imageUrl}
            alt={current.title ?? current.query}
            className="h-full w-full object-cover"
          />
          <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
            {current.query}
          </span>
        </div>
      )}
    </div>
  );
}
