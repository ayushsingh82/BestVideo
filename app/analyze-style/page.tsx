"use client";

import { useState } from "react";
import { Navbar } from "@/app/components/Navbar";

type Status = "idle" | "loading" | "done" | "error";

interface StyleProfile {
  totalDurationS: number;
  captionCount: number;
  avgCaptionDurationS: number;
  captionsPerMinute: number;
  speakingRateWpm: number;
  avgGapS: number;
  hardCutCount: number;
  pacing: "fast" | "medium" | "slow";
  summary: string;
}

interface AnalyzeResult {
  videoId: string;
  title?: string;
  author?: string;
  profile?: StyleProfile;
  error?: string;
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const PACING_LABEL: Record<StyleProfile["pacing"], string> = {
  fast: "Fast-paced",
  medium: "Medium-paced",
  slow: "Slow, long-take",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-200 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default function AnalyzeStylePage() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function extractVideoId(input: string): string | null {
    try {
      const u = new URL(input.trim());
      const host = u.hostname.replace(/^www\./, "");
      if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
      if (host === "youtube.com" || host === "m.youtube.com") {
        if (u.pathname === "/watch") return u.searchParams.get("v");
        const shorts = u.pathname.match(/^\/shorts\/([^/]+)/);
        if (shorts) return shorts[1];
      }
      return null;
    } catch {
      if (/^[\w-]{11}$/.test(input.trim())) return input.trim();
      return null;
    }
  }

  async function handleAnalyze() {
    const id = extractVideoId(url);
    if (!id) {
      setError("That doesn't look like a valid YouTube URL.");
      return;
    }
    setVideoId(id);
    setStatus("loading");
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl: url }),
      });
      const data = (await res.json()) as AnalyzeResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Couldn't analyze that video.");
      setResult(data);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-white text-neutral-950 antialiased">
      <Navbar />

      <main className="mx-auto max-w-2xl px-6 pb-24 pt-32 lg:pt-40">
        <div className="text-center">
          <h1 className="text-balance text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl">
            Understand any video&apos;s <span className="font-serif font-normal italic">editing style</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-neutral-500">
            Paste a YouTube link. We&apos;ll read its caption timing to work out the pacing —
            how fast it&apos;s cut, how long text stays on screen, and how fast the speaker talks.
          </p>
        </div>

        {/* URL input */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAnalyze();
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-950"
          />
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!url || status === "loading"}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-8 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "loading" ? (
              <>
                <Spinner /> Analyzing…
              </>
            ) : (
              "Analyze"
            )}
          </button>
        </div>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Video preview */}
        {videoId && (
          <div className="mt-8 aspect-video w-full overflow-hidden border border-neutral-200 bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="Reference video"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8">
            {result.title && (
              <p className="text-sm text-neutral-500">
                <span className="font-medium text-neutral-800">{result.title}</span>
                {result.author ? ` — ${result.author}` : ""}
              </p>
            )}

            {result.profile ? (
              <>
                <div className="mt-4 border border-neutral-950 bg-neutral-50 px-5 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                    Style summary
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-800">{result.profile.summary}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Stat label="Pacing" value={PACING_LABEL[result.profile.pacing]} />
                  <Stat
                    label="Length"
                    value={
                      result.profile.totalDurationS < 60
                        ? `${Math.round(result.profile.totalDurationS)}s`
                        : `${Math.round(result.profile.totalDurationS / 60)} min`
                    }
                  />
                  <Stat label="Captions/min" value={result.profile.captionsPerMinute.toFixed(1)} />
                  <Stat label="Avg caption on-screen" value={`${result.profile.avgCaptionDurationS.toFixed(1)}s`} />
                  <Stat label="Speaking rate" value={`${Math.round(result.profile.speakingRateWpm)} wpm`} />
                  <Stat label="Notable pauses/cuts" value={`${result.profile.hardCutCount}`} />
                </div>

                <p className="mt-6 text-center text-xs text-neutral-400">
                  This is a caption-timing proxy for pacing — it doesn&apos;t yet see actual cuts, B-roll
                  images, or motion graphics. Full visual analysis is on the roadmap.
                </p>
              </>
            ) : (
              <div className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {result.error ?? "No captions available for this video."}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
