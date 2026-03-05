"use client";

import { useMemo } from "react";
import { HERO_VIDEO_URLS } from "../config/hero-videos";

export function HeroVideo() {
  const src = useMemo(
    () => HERO_VIDEO_URLS[Math.floor(Math.random() * HERO_VIDEO_URLS.length)],
    []
  );

  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      className="h-full w-full object-cover opacity-80"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
