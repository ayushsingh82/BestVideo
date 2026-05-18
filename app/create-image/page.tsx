"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/app/components/Navbar";

const ASPECT_RATIOS = [
  { value: "1:1", label: "Square", hint: "1:1" },
  { value: "16:9", label: "Landscape", hint: "16:9" },
  { value: "9:16", label: "Portrait", hint: "9:16" },
  { value: "3:2", label: "Photo", hint: "3:2" },
  { value: "2:3", label: "Poster", hint: "2:3" },
  { value: "4:5", label: "Social", hint: "4:5" },
];

const QUICK_PROMPTS = [
  "Neon-lit Tokyo alley after rain, cinematic, 50mm",
  "Astronaut surfing on a wave of stars, dreamy",
  "Cozy mountain cabin at golden hour, watercolor",
  "Cyberpunk samurai portrait, high detail",
];

async function safeJson(res: Response): Promise<{ ok: boolean; data: Record<string, unknown> | null; text: string | null }> {
  const text = await res.text();
  try {
    return { ok: true, data: text ? JSON.parse(text) : null, text };
  } catch {
    return { ok: false, data: null, text };
  }
}

function aspectClass(value: string): string {
  switch (value) {
    case "1:1":
      return "aspect-square";
    case "16:9":
      return "aspect-video";
    case "9:16":
      return "aspect-[9/16]";
    case "3:2":
      return "aspect-[3/2]";
    case "2:3":
      return "aspect-[2/3]";
    case "4:5":
      return "aspect-[4/5]";
    default:
      return "aspect-square";
  }
}

export default function CreateImagePage() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId || jobStatus === "completed" || jobStatus === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/job-image/${jobId}`);
        const parsed = await safeJson(res);
        if (!res.ok || !parsed.ok) {
          console.error("job poll failed", res.status, parsed.text?.slice(0, 200));
          return;
        }
        const data = parsed.data as { status?: string; imageUrl?: string; errorMessage?: string };
        setJobStatus(data.status ?? null);
        if (data.status === "completed") {
          setImageUrl(data.imageUrl ?? null);
          clearInterval(interval);
        } else if (data.status === "failed") {
          setError(data.errorMessage || "Generation failed");
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setJobId(null);
    setJobStatus(null);
    setImageUrl(null);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspect_ratio: aspectRatio }),
      });

      const parsed = await safeJson(res);

      if (!parsed.ok) {
        if (res.status === 401) {
          setError("Please sign in to generate images.");
        } else if (res.status >= 500) {
          setError("The server returned an unexpected response. Please try again in a moment.");
        } else {
          setError(`Request failed (${res.status}). Please try again.`);
        }
        return;
      }

      const data = parsed.data as { jobId?: string; status?: string; error?: string; code?: string; creditsRequired?: number };

      if (!res.ok) {
        if (res.status === 402 && data.code === "INSUFFICIENT_CREDITS") {
          setError(`Insufficient credits. You need ${data.creditsRequired ?? 5} credits.`);
        } else if (res.status === 401) {
          setError("Please sign in to generate images.");
        } else {
          setError(data.error || "Failed to submit job");
        }
        return;
      }

      setJobId(data.jobId ?? null);
      setJobStatus(data.status ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  const generating = jobStatus === "queued" || jobStatus === "processing";
  const locked = isSubmitting || generating;
  const charCount = prompt.length;

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-white">
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 sm:pt-32 lg:px-8 lg:pb-24">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Studio</p>
            <h1 className="mt-2 bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl md:text-5xl">
              Create an image
            </h1>
            <p className="mt-3 text-base text-neutral-400 sm:text-lg">
              Describe what you want to see. Generation costs 5 credits.
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-neutral-300 sm:inline-flex">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            Service online
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left: Form */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 shadow-xl shadow-black/30 sm:p-7">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Prompt */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="prompt" className="text-sm font-semibold text-white">
                      Prompt
                    </label>
                    <span className={`text-xs ${charCount > 1800 ? "text-amber-400" : "text-neutral-500"}`}>
                      {charCount}/2000
                    </span>
                  </div>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value.slice(0, 2000))}
                    placeholder="A futuristic city skyline at sunset, cinematic, ultra-detailed..."
                    className="min-h-[140px] w-full resize-y rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3.5 text-[15px] text-white placeholder-neutral-500 transition-colors focus:border-white/40 focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-white/20"
                    disabled={locked}
                  />

                  {/* Quick prompt chips */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => !locked && setPrompt(p)}
                        disabled={locked}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-300 transition hover:border-white/30 hover:bg-white/10 hover:text-white disabled:opacity-50"
                      >
                        {p.length > 38 ? p.slice(0, 35) + "…" : p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio - visual selector */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-white">Aspect ratio</label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {ASPECT_RATIOS.map((r) => {
                      const active = aspectRatio === r.value;
                      return (
                        <button
                          type="button"
                          key={r.value}
                          onClick={() => !locked && setAspectRatio(r.value)}
                          disabled={locked}
                          className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition disabled:opacity-50 ${
                            active
                              ? "border-white bg-white/10"
                              : "border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/5"
                          }`}
                          aria-pressed={active}
                        >
                          <div
                            className={`flex w-7 items-center justify-center rounded-md ${
                              active ? "bg-white" : "bg-white/30 group-hover:bg-white/50"
                            } ${aspectClass(r.value)}`}
                          />
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? "text-white" : "text-neutral-400"}`}>
                            {r.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className="flex gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                    <svg className="mt-0.5 h-4 w-4 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12a2 2 0 00-3.48 0l-7.07 12a2 2 0 001.74 3z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!prompt.trim() || locked}
                  className="group relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-neutral-950 shadow-lg shadow-white/10 transition-all hover:shadow-xl hover:shadow-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <><Spinner /> Submitting…</>
                  ) : generating ? (
                    <><Spinner /> Generating…</>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l3.057 6.043L14 12l-5.943 2.957L5 21l-3.057-6.043L-4 12l5.943-2.957z" transform="translate(8 0)" />
                      </svg>
                      Generate image
                      <span className="text-xs font-medium text-neutral-500">· 5 credits</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Tips */}
            <details className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 open:bg-white/[0.05]" open>
              <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-white">
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Tips for better prompts
                </span>
                <svg className="h-4 w-4 text-neutral-400 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <ul className="mt-4 grid gap-2.5 text-sm text-neutral-400">
                <li className="flex gap-2"><span className="text-neutral-600">•</span>Be specific about the subject and surroundings.</li>
                <li className="flex gap-2"><span className="text-neutral-600">•</span>Include style keywords like &quot;cinematic&quot;, &quot;cyberpunk&quot;, &quot;watercolor&quot;.</li>
                <li className="flex gap-2"><span className="text-neutral-600">•</span>Mention lighting (e.g., &quot;golden hour&quot;, &quot;neon&quot;).</li>
                <li className="flex gap-2"><span className="text-neutral-600">•</span>State the angle (e.g., &quot;wide shot&quot;, &quot;macro&quot;).</li>
              </ul>
            </details>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent">
              {/* Header bar */}
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5 sm:px-6">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
                  </div>
                  <span className="ml-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Preview · {aspectRatio}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {imageUrl && (
                    <>
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </a>
                      <button
                        onClick={() => {
                          setPrompt("");
                          setJobId(null);
                          setJobStatus(null);
                          setImageUrl(null);
                          setError(null);
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reset
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Canvas */}
              <div
                className="relative flex w-full items-center justify-center p-4 sm:p-8"
                style={{ minHeight: "420px" }}
              >
                {/* checker bg */}
                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage: `linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)`,
                    backgroundSize: "24px 24px",
                    backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0",
                  }}
                />

                <div
                  className={`relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl ${aspectClass(aspectRatio)}`}
                >
                  {!jobStatus && !imageUrl && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                        <svg className="h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-semibold text-white">Your image will appear here</h3>
                      <p className="mt-1.5 max-w-xs text-sm text-neutral-500">
                        Pick an aspect ratio, write a prompt, and hit generate.
                      </p>
                    </div>
                  )}

                  {generating && !imageUrl && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <div className="relative mb-5 h-16 w-16">
                        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                        <div className="absolute inset-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      </div>
                      <p className="text-base font-semibold text-white">
                        {jobStatus === "queued" ? "Queued…" : "Generating image"}
                      </p>
                      <p className="mt-1.5 text-sm text-neutral-500">
                        {jobStatus === "queued"
                          ? "Waiting for a worker"
                          : "Usually 5–15 seconds"}
                      </p>
                      {/* progress bar (indeterminate) */}
                      <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-1/3 animate-[shimmer_1.5s_infinite] rounded-full bg-white" style={{ animation: "shimmer 1.5s ease-in-out infinite" }} />
                      </div>
                      <style jsx>{`
                        @keyframes shimmer {
                          0% { transform: translateX(-100%); }
                          100% { transform: translateX(400%); }
                        }
                      `}</style>
                    </div>
                  )}

                  {imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={imageUrl}
                      alt={prompt || "Generated image"}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
