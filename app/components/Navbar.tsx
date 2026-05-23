"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const navLinks = [
  { name: "How it works", href: "/#how" },
  { name: "Features", href: "/#features" },
  { name: "Pricing", href: "/#pricing" },
];

const ENTER_EASE = [0.16, 1, 0.3, 1] as const;

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the mobile menu on outside click / Escape.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isMobileMenuOpen]);

  return (
    <motion.header
      ref={headerRef}
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.75, ease: ENTER_EASE }}
      className={`fixed z-50 transition-[top,left,right] duration-500 ${
        isScrolled ? "left-4 right-4 top-4" : "left-0 right-0 top-0"
      }`}
    >
      <nav
        className={`mx-auto transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? "max-w-[1200px] rounded-2xl border border-neutral-200 bg-white/80 shadow-lg backdrop-blur-xl"
            : "max-w-[1400px] bg-transparent"
        }`}
      >
        <div
          className={`flex items-center justify-between px-6 transition-all duration-500 lg:px-8 ${
            isScrolled ? "h-14" : "h-20"
          }`}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: ENTER_EASE }}
          >
            <Link href="/" className="flex items-center gap-2">
              <span
                className={`font-semibold tracking-tight text-neutral-950 transition-all duration-500 ${
                  isScrolled ? "text-xl" : "text-2xl"
                }`}
              >
                BestVideo
              </span>
            </Link>
          </motion.div>

          {/* Desktop nav — staggered reveal */}
          <div className="hidden items-center gap-12 md:flex">
            {navLinks.map((link, i) => (
              <motion.a
                key={link.name}
                href={link.href}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.32 + i * 0.08, ease: ENTER_EASE }}
                className="group relative text-sm font-medium text-neutral-600 transition-colors duration-300 hover:text-neutral-950"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-neutral-950 transition-all duration-300 group-hover:w-full" />
              </motion.a>
            ))}
          </div>

          {/* Desktop CTA */}
          <motion.div
            className="hidden items-center gap-4 md:flex"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.56, ease: ENTER_EASE }}
          >
            <Link
              href="/create-video"
              className={`inline-flex items-center rounded-full bg-neutral-950 font-medium text-white transition-all duration-500 hover:bg-neutral-800 ${
                isScrolled ? "h-8 px-4 text-xs" : "h-10 px-6 text-sm"
              }`}
            >
              Get started
            </Link>
          </motion.div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((o) => !o)}
            className="p-2 text-neutral-950 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown — sits below the bar, only as tall as its content */}
      <div
        className={`absolute left-3 right-3 top-full mt-2 origin-top transition-all duration-300 md:hidden ${
          isMobileMenuOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        <nav className="flex flex-col gap-1 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-neutral-800 transition hover:bg-neutral-100"
            >
              {link.name}
            </a>
          ))}
          <Link
            href="/create-video"
            onClick={() => setIsMobileMenuOpen(false)}
            className="mt-2 flex items-center justify-center rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Get started
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
