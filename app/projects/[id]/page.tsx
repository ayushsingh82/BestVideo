"use client";

import { use, useEffect, useState } from "react";
import { Navbar } from "@/app/components/Navbar";

interface Status {
  status: string;
  done: boolean;
  failed: boolean;
  videoUrl?: string;
  transcriptUrl?: string;
  error?: string;
}

const FRIENDLY: Record<string, string> = {
  uploaded: "Uploaded — queuing…",
  pending: "Queued…",
  processing: "Adding captions…",
  transcribing: "Transcribing speech…",
  rendering: "Rendering your video…",
  completed: "Done!",
  failed: "Failed",
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [state, setState] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/projects/${id}`);
        const data = (await res.json()) as Status & { error?: string };
        if (!active) return;
        if (!res.ok) {
          setError(data.error ?? `Request failed (${res.status})`);
          return;
        }
        setState(data);
        if (data.failed) {
          setError(data.error ?? "Captioning failed.");
          return;
        }
        if (!data.done) {
          timer = setTimeout(poll, 4000);
        }
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    }

    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id]);

  const label = state ? FRIENDLY[state.status] ?? state.status : "Starting…";
  const working = !error && !(state?.done);

  return (
    <div className="min-h-screen bg-white text-neutral-950 antialiased">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 pt-28 pb-16">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">Project</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your captioned video</h1>

        {error && (
          <div className="mt-8 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {working && (
          <div className="mt-10 flex flex-col items-center gap-4 border border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
            <svg className="h-6 w-6 animate-spin text-neutral-700" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm font-medium">{label}</p>
            <p className="max-w-sm text-xs text-neutral-500">
              This usually takes 1–3 minutes for a short clip. You can keep this tab open.
            </p>
          </div>
        )}

        {state?.done && state.videoUrl && (
          <div className="mt-10">
            <div className="border border-neutral-200 bg-black">
              <video src={state.videoUrl} controls playsInline autoPlay className="h-auto w-full" />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={state.videoUrl}
                download
                className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Download video
              </a>
              <a
                href="/create-video"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-950"
              >
                Caption another
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
