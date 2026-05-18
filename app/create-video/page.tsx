"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/app/components/Navbar";

export default function CreateVideoPage() {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId || jobStatus === "completed" || jobStatus === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/job/${jobId}`);
        if (!res.ok) throw new Error("Failed to fetch job status");
        const data = await res.json();

        setJobStatus(data.status);
        if (data.status === "completed") {
          setVideoUrl(data.videoUrl);
          clearInterval(interval);
        } else if (data.status === "failed") {
          setError(data.errorMessage || "Generation failed");
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setJobId(null);
    setJobStatus(null);
    setVideoUrl(null);

    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402 && data.code === "INSUFFICIENT_CREDITS") {
          setError(`Insufficient credits. You need ${data.creditsRequired || 10} credits.`);
        } else if (res.status === 429) {
          setError(data.error || "Too many requests. Please slow down.");
        } else {
          throw new Error(data.error || "Failed to submit job");
        }
      } else {
        setJobId(data.jobId);
        setJobStatus(data.status);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  const generating = jobStatus === "queued" || jobStatus === "processing";

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-white">
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Create Video</h1>
          <p className="text-lg text-neutral-400">
            Describe the scene; the AI renders a short video for you (costs 10 credits).
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left: Form */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6 shadow-sm backdrop-blur-md">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label htmlFor="prompt" className="mb-2 block text-sm font-semibold text-neutral-300">
                    Prompt
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A cat walking in the rain, cinematic, slow motion..."
                    className="min-h-[160px] w-full resize-y rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white placeholder-neutral-500 transition-colors focus:border-white/30 focus:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-white/30"
                    disabled={isSubmitting || generating}
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!prompt.trim() || isSubmitting || generating}
                  className="mt-2 flex w-full items-center justify-center rounded-xl bg-white px-4 py-4 text-sm font-semibold text-neutral-950 shadow-md transition-all hover:bg-neutral-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:shadow-md"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner /> Submitting...
                    </span>
                  ) : generating ? (
                    <span className="flex items-center gap-2">
                      <Spinner /> Generating...
                    </span>
                  ) : (
                    "Generate Video"
                  )}
                </button>
              </form>
            </div>

            <div className="hidden rounded-2xl border border-white/5 bg-white/5 p-6 lg:block">
              <h3 className="mb-3 text-sm font-semibold text-white">Tips for better video prompts</h3>
              <ul className="list-disc space-y-2.5 pl-4 text-sm text-neutral-400 marker:text-neutral-500">
                <li>Describe motion explicitly (&quot;slow pan&quot;, &quot;tracking shot&quot;).</li>
                <li>State the subject, setting, and lighting (&quot;neon city, night, rain&quot;).</li>
                <li>Add a style tag (&quot;cinematic&quot;, &quot;anime&quot;, &quot;documentary&quot;).</li>
                <li>Keep it short and concrete — long prompts can drift.</li>
              </ul>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="flex h-[500px] flex-col lg:col-span-7 lg:h-[700px]">
            <div className="relative flex flex-1 flex-col rounded-3xl border-2 border-dashed border-white/10 bg-white/5 p-4 transition-all duration-300 sm:p-6">
              <div className="absolute top-4 left-0 z-20 mb-4 flex min-h-[40px] w-full items-center justify-between px-6 sm:px-8">
                <span className="rounded-lg border border-white/10 bg-neutral-900/80 px-3 py-1.5 text-sm font-semibold uppercase tracking-widest text-neutral-400 shadow-sm backdrop-blur">
                  Preview
                </span>
                {videoUrl && (
                  <button
                    onClick={() => {
                      setPrompt("");
                      setJobId(null);
                      setJobStatus(null);
                      setVideoUrl(null);
                      setError(null);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset
                  </button>
                )}
              </div>

              <div className="relative mt-12 flex h-full w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-sm">
                {!jobStatus && !videoUrl && (
                  <div className="animate-in fade-in flex max-w-sm flex-col items-center p-8 text-center duration-500">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/5 bg-neutral-900 text-neutral-500 shadow-sm">
                      <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-white">No video yet</h3>
                    <p className="text-base leading-relaxed text-neutral-400">
                      Enter a prompt on the left to render your first clip. Generation usually takes a minute or two.
                    </p>
                  </div>
                )}

                {generating && !videoUrl && (
                  <div className="animate-in zoom-in-95 z-10 flex flex-col items-center p-8 text-center duration-500">
                    <div className="relative mb-8 h-20 w-20">
                      <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                      <div className="absolute inset-0 animate-spin rounded-full border-4 border-white border-t-transparent" />
                    </div>
                    <p className="mb-2 text-2xl font-semibold text-white">
                      {jobStatus === "queued" ? "Queued..." : "Rendering video"}
                    </p>
                    <p className="max-w-[280px] text-base text-neutral-400">
                      {jobStatus === "queued"
                        ? "Waiting for a worker to pick this up."
                        : "Talking to the AI provider — usually 30 seconds to a few minutes."}
                    </p>
                  </div>
                )}

                {videoUrl && (
                  <div className="animate-in fade-in zoom-in-95 group absolute inset-0 flex h-full w-full flex-col duration-700">
                    <div className="absolute inset-0 bg-neutral-900" />
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="absolute inset-0 z-10 h-full w-full object-contain shadow-sm"
                    />
                    <div className="absolute right-4 bottom-4 z-20 flex gap-2">
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-900 shadow-xl transition-transform hover:scale-105"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </a>
                    </div>
                  </div>
                )}
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
    <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
