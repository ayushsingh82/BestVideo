"use client";

import { useEffect, useState } from "react";

type Mode = "login" | "signup";

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-neutral-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950"
      />
    </label>
  );
}

export function AuthModal({
  open,
  onClose,
  initialMode = "signup",
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(`Couldn't ${mode === "signup" ? "sign up" : "log in"} (${res.status}).`);
      window.location.href = "/create-video";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md border border-neutral-200 bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-neutral-400 transition hover:text-neutral-950"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-semibold tracking-tight">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h2>
        <p className="mt-1.5 text-sm text-neutral-500">
          {mode === "signup"
            ? "Start turning raw footage into finished video."
            : "Log in to your projects."}
        </p>

        {/* Black & white segmented toggle */}
        <div className="mt-6 grid grid-cols-2 gap-1 border border-neutral-950 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`py-2 text-sm font-medium transition ${
              mode === "login" ? "bg-neutral-950 text-white" : "bg-white text-neutral-950 hover:bg-neutral-100"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`py-2 text-sm font-medium transition ${
              mode === "signup" ? "bg-neutral-950 text-white" : "bg-white text-neutral-950 hover:bg-neutral-100"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <Field label="Name" value={name} onChange={setName} placeholder="Jane Doe" autoComplete="name" />
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-neutral-950 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-neutral-500">
          {mode === "signup" ? "Already have an account? " : "New here? "}
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            className="font-medium text-neutral-950 underline underline-offset-2"
          >
            {mode === "signup" ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
