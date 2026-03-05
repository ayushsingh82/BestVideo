"use client";

import { useState, useEffect } from "react";

const navLinks = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-30 border-white/10 bg-neutral-950 backdrop-blur-sm transition-all duration-300 ease-out ${
        scrolled
          ? "mx-2 mt-2 rounded-2xl border border-white/10 shadow-lg sm:mx-4 md:mx-6 lg:mx-8"
          : "border-b border-white/10"
      }`}
    >
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between px-4 transition-all duration-300 sm:px-6 md:px-8 ${
          scrolled ? "h-12 py-2 sm:h-14" : "h-14 sm:h-16"
        }`}
      >
        <a href="/" className="text-lg font-semibold text-white sm:text-xl">
          BestVideo
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-5 md:flex md:gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-white transition hover:text-neutral-200"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#create"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
          >
            Get started
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition hover:bg-white/10 md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu overlay — black bg, white text; tap outside to close */}
      <div
        className={`fixed inset-0 z-20 bg-neutral-950 pt-14 transition-opacity duration-200 md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
      >
        <nav className="flex flex-col px-4 py-6" onClick={(e) => e.stopPropagation()}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-3 text-base font-medium text-white transition hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#create"
            className="mt-4 rounded-full bg-white px-6 py-3.5 text-center text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
            onClick={() => setMobileOpen(false)}
          >
            Get started
          </a>
        </nav>
      </div>
    </header>
  );
}
