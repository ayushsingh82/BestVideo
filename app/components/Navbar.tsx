"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/create-video", label: "Create Video" },
  { href: "/create-image", label: "Create Image" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on outside click / Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  // Transparent variant: on landing page hero (top of `/`, not scrolled).
  // Stays transparent even when the mobile menu is open — the menu itself uses a blurred glass panel.
  const isLanding = pathname === "/";
  const transparent = isLanding && !scrolled;

  // Subtle shadow on text for legibility against the video.
  const transparentTextShadow = "0 1px 2px rgba(0,0,0,0.45), 0 0 12px rgba(0,0,0,0.25)";

  // Keep border-width constant and only animate the color + bg, so there's no
  // 1px "snap" when toggling between transparent and filled states.
  const headerStyle: React.CSSProperties = {
    backgroundColor: transparent ? "rgba(10, 10, 10, 0)" : "rgba(10, 10, 10, 1)",
    color: "#ffffff",
    borderColor: transparent ? "rgba(255, 255, 255, 0)" : "rgba(255, 255, 255, 0.1)",
    boxShadow: transparent
      ? "0 0 0 0 rgba(0,0,0,0)"
      : "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
    backdropFilter: transparent ? "blur(0px)" : "blur(4px)",
    WebkitBackdropFilter: transparent ? "blur(0px)" : "blur(4px)",
    transitionProperty: "background-color, border-color, box-shadow, backdrop-filter, color",
    transitionDuration: "350ms",
    transitionTimingFunction: "ease-out",
  };

  const linkTextClass = transparent
    ? "font-bold text-white hover:text-white/80"
    : "text-white hover:text-neutral-200";
  const brandColor = "#ffffff";
  const ctaClass = transparent
    ? "rounded-full bg-white px-4 py-2 text-sm font-bold text-neutral-950 transition hover:bg-neutral-200"
    : "rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200";
  const iconColor = "#ffffff";
  const mobileBtnHover = "hover:bg-white/10";
  const textShadowStyle = transparent ? { textShadow: transparentTextShadow } : undefined;

  return (
    <header
      ref={headerRef}
      className={`fixed z-30 border
      left-2 right-2 top-2 rounded-2xl
      sm:left-4 sm:right-4 sm:top-4
      md:left-6 md:right-6 md:top-4
      lg:left-8 lg:right-8 lg:top-4`}
      style={headerStyle}
    >
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between px-4 transition-all duration-300 sm:px-6 md:px-8 ${
          scrolled ? "h-12 py-2 sm:h-14" : "h-14 sm:h-16"
        }`}
      >
        <a
          href="/"
          className="text-lg font-semibold sm:text-xl"
          style={{ color: brandColor, ...textShadowStyle }}
        >
          BestVideo
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-5 md:flex md:gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm transition ${linkTextClass}`}
              style={textShadowStyle}
            >
              {link.label}
            </a>
          ))}
          <a href="/create-video" className={ctaClass}>
            Get started
          </a>
        </div>

        {/* Mobile button */}
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${mobileBtnHover} md:hidden`}
          style={{ color: iconColor, ...textShadowStyle }}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu — overlay sits inside the rounded header so the panel inherits the same shape */}
      <div
        className={`absolute left-0 right-0 top-full mt-2 transition-all duration-300 md:hidden ${
          mobileOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
        aria-hidden={!mobileOpen}
      >
        <nav
          className="flex flex-col gap-1 rounded-2xl border p-3"
          style={{
            backgroundColor: transparent ? "rgba(10, 10, 10, 0.55)" : "rgba(10, 10, 10, 0.95)",
            borderColor: transparent ? "rgba(255, 255, 255, 0.18)" : "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(16px) saturate(140%)",
            WebkitBackdropFilter: "blur(16px) saturate(140%)",
            boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5)",
            transitionProperty: "background-color, border-color",
            transitionDuration: "300ms",
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-xl px-4 py-3 text-base font-semibold text-white transition hover:bg-white/10"
              style={textShadowStyle}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}

          <a
            href="/create-video"
            className="mt-2 rounded-full bg-white px-6 py-3.5 text-center text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
            onClick={() => setMobileOpen(false)}
          >
            Get started
          </a>
        </nav>
      </div>
    </header>
  );
}
