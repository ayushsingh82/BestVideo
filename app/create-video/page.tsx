"use client";

import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/app/components/Navbar";
import { CAPTION_FONTS } from "./fonts";

type Status = "idle" | "uploading" | "done" | "error";

interface Cue {
  start: number;
  end: number;
  query: string;
  imageUrl: string;
  title?: string;
}

const FONT_COLORS = ["#FFFFFF", "#000000", "#FFE600", "#00E5A0", "#FF4D8D", "#4D8DFF"];
const HIGHLIGHT_COLORS = ["#FFE600", "#00E5A0", "#FF4D8D", "#4D8DFF", "#FF8A00", "#A855F7"];

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------- small controls ---------- */

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/**
 * Plays the user's ORIGINAL video and overlays a relevant photo on the top 30%
 * of the frame, switching as the playhead moves through the keyword cues.
 */
function BrollPreview({ src, cues }: { src: string; cues: Cue[] }) {
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

type FrameStyle =
  | "black"
  | "white"
  | "navy"
  | "sunset"
  | "ocean"
  | "berry"
  | "polaroid"
  | "filmstrip"
  | "stripes";

// Border thickness is now user-controlled (see borderPct state) instead of fixed per preset.
// "polaroid" keeps a slightly deeper bottom for the classic look (see frameInsetStyle below).
const FRAME_STYLES: { id: FrameStyle; label: string; border: string }[] = [
  // Single colors
  { id: "black", label: "Classic black", border: "bg-neutral-950" },
  { id: "white", label: "Clean white", border: "bg-white" },
  { id: "navy", label: "Navy", border: "bg-blue-950" },
  // Multicolor gradients
  { id: "sunset", label: "Sunset", border: "bg-gradient-to-br from-orange-400 via-rose-500 to-purple-600" },
  { id: "ocean", label: "Ocean", border: "bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-700" },
  { id: "berry", label: "Berry", border: "bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600" },
  // Designed frames — polaroid is a warm off-white (not plain white, so it reads distinct from
  // "Clean white" in the picker) and stripes is a 2-color hazard-tape pattern.
  { id: "polaroid", label: "Polaroid", border: "bg-stone-100" },
  { id: "filmstrip", label: "Film strip", border: "bg-neutral-950" },
  {
    id: "stripes",
    label: "Hazard",
    border: "bg-[repeating-linear-gradient(45deg,#0a0a0a_0px,#0a0a0a_14px,#facc15_14px,#facc15_28px)]",
  },
];

const ASPECT_RATIOS: { id: string; label: string; value: string }[] = [
  { id: "16:9", label: "16:9", value: "16 / 9" },
  { id: "9:16", label: "9:16", value: "9 / 16" },
  { id: "1:1", label: "1:1", value: "1 / 1" },
  { id: "4:5", label: "4:5", value: "4 / 5" },
];

/** How far the border eats into the frame on the bottom edge (polaroid runs a bit deeper). */
function frameBottomPct(id: FrameStyle, pct: number): number {
  return id === "polaroid" ? pct + 4 : pct;
}

/** Inset for the inner video window, in %, driven by the user's border-thickness slider. */
function frameInsetStyle(id: FrameStyle, pct: number): React.CSSProperties {
  return { top: `${pct}%`, left: `${pct}%`, right: `${pct}%`, bottom: `${frameBottomPct(id, pct)}%` };
}

/** Sprocket-hole row along the top and bottom border of the film-strip frame. */
function FilmStripHoles() {
  const dots = Array.from({ length: 9 });
  return (
    <>
      <div className="absolute inset-x-0 top-[4%] flex justify-between px-[7%]">
        {dots.map((_, i) => (
          <span key={i} className="h-2 w-2 rounded-[2px] bg-neutral-50/80" />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-[4%] flex justify-between px-[7%]">
        {dots.map((_, i) => (
          <span key={i} className="h-2 w-2 rounded-[2px] bg-neutral-50/80" />
        ))}
      </div>
    </>
  );
}

/** Wraps the video in a preset border frame, thickness driven by borderPct. */
function FramedVideo({
  src,
  frameStyle,
  borderPct,
}: {
  src: string;
  frameStyle: FrameStyle;
  borderPct: number;
}) {
  const preset = FRAME_STYLES.find((f) => f.id === frameStyle) ?? FRAME_STYLES[0];
  return (
    <div className={`relative h-full w-full ${preset.border}`}>
      {preset.id === "filmstrip" && <FilmStripHoles />}
      <div
        className={`absolute overflow-hidden ${preset.id === "polaroid" ? "shadow-md" : "shadow-inner"}`}
        style={frameInsetStyle(preset.id, borderPct)}
      >
        <video src={src} controls playsInline className="h-full w-full object-cover" />
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-neutral-950" : "bg-neutral-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function ColorRow({
  label,
  value,
  presets,
  onChange,
}: {
  label: string;
  value: string;
  presets: string[];
  onChange: (c: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-neutral-500">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={c}
            style={{ backgroundColor: c }}
            className={`h-8 w-8 rounded-full transition ${
              value.toLowerCase() === c.toLowerCase()
                ? "ring-2 ring-neutral-950 ring-offset-2"
                : "ring-1 ring-inset ring-neutral-300"
            }`}
          />
        ))}
        <label className="relative grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-dashed border-neutral-300 text-neutral-500 transition hover:border-neutral-500">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
        </label>
      </div>
    </div>
  );
}

function CaptionSample({
  fontClass,
  color,
  highlight,
}: {
  fontClass: string;
  color: string;
  highlight: string;
}) {
  const words = ["This", "is", "how", "your", "captions", "look"];
  const hi = 4;
  return (
    <p className={`text-2xl font-bold uppercase leading-tight sm:text-3xl ${fontClass}`}>
      {words.map((w, i) => (
        <span key={i} style={{ color: i === hi ? highlight : color }}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}

/* ---------- page ---------- */

export default function CreateVideoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [pendingAction, setPendingAction] = useState<"captions" | "photos" | null>(null);
  const [stageLabel, setStageLabel] = useState("Uploading…");
  const [photosResult, setPhotosResult] = useState<{ src: string; cues: Cue[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Canva-style style settings.
  const [subtitles, setSubtitles] = useState(true);
  const [broll, setBroll] = useState(true);
  const [fontId, setFontId] = useState(CAPTION_FONTS[0].id);
  const [fontColor, setFontColor] = useState("#FFFFFF");
  const [highlightColor, setHighlightColor] = useState("#FFE600");

  const [frameEnabled, setFrameEnabled] = useState(false);
  const [frameStyle, setFrameStyle] = useState<FrameStyle>("black");
  const [borderPct, setBorderPct] = useState(12);
  const [aspectRatio, setAspectRatio] = useState("16:9");

  const activeFont = CAPTION_FONTS.find((f) => f.id === fontId) ?? CAPTION_FONTS[0];
  const activeFramePreset = FRAME_STYLES.find((f) => f.id === frameStyle) ?? FRAME_STYLES[0];
  const activeAspect = ASPECT_RATIOS.find((r) => r.id === aspectRatio) ?? ASPECT_RATIOS[0];
  const uploading = status === "uploading";

  function selectFile(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError("Please choose a video file (MP4, MOV, WebM).");
      return;
    }
    setError(null);
    setStatus("idle");
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setStatus("idle");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function startProject(): Promise<string> {
    const form = new FormData();
    form.append("file", file as File);
    form.append(
      "settings",
      JSON.stringify({ subtitles, font: fontId, fontColor, highlightColor })
    );
    const createRes = await fetch("/api/projects", { method: "POST", body: form });
    if (!createRes.ok) {
      const data = (await createRes.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? `Couldn't start the project (${createRes.status}).`);
    }
    const { projectId } = (await createRes.json()) as { projectId: string };
    return projectId;
  }

  /** Poll the project until ZapCap finishes; returns the transcript URL. */
  async function waitForTranscript(projectId: string): Promise<string> {
    for (;;) {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = (await res.json()) as {
        done?: boolean;
        failed?: boolean;
        transcriptUrl?: string;
        error?: string;
      };
      if (!res.ok || data.failed) throw new Error(data.error ?? "Processing failed.");
      if (data.done) {
        if (!data.transcriptUrl) throw new Error("No transcript was produced (is there speech?).");
        return data.transcriptUrl;
      }
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  // "Add captions" — render captions and open the result page.
  async function handleCaptions() {
    if (!file) return;
    setPendingAction("captions");
    setStageLabel("Uploading…");
    setStatus("uploading");
    setError(null);
    try {
      const projectId = await startProject();
      setStatus("done");
      window.location.href = `/projects/${projectId}`;
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPendingAction(null);
    }
  }

  // "Add photos" — transcribe, match images to keywords, preview over the
  // ORIGINAL video at the top 30% (no captions, no watermark).
  async function handlePhotos() {
    if (!file || !previewUrl) return;
    setPendingAction("photos");
    setStatus("uploading");
    setError(null);
    try {
      setStageLabel("Uploading & transcribing…");
      const projectId = await startProject();
      const transcriptUrl = await waitForTranscript(projectId);

      setStageLabel("Finding photos for your words…");
      const res = await fetch("/api/broll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcriptUrl }),
      });
      const data = (await res.json()) as { cues?: Cue[]; error?: string; note?: string };
      if (!res.ok) throw new Error(data.error ?? "Couldn't fetch photos.");
      if (!data.cues || data.cues.length === 0) {
        throw new Error(data.note ?? "No keywords found to match photos (try a clip with clearer speech).");
      }

      setPhotosResult({ src: previewUrl, cues: data.cues });
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPendingAction(null);
    }
  }

  return (
    <div className="min-h-screen bg-white text-neutral-950 antialiased">
      <Navbar />

      <div className="flex min-h-screen flex-col pt-20 lg:flex-row">
        {/* Sidebar — Canva-style controls */}
        <aside className="w-full shrink-0 border-b border-neutral-200 lg:h-[calc(100vh-5rem)] lg:w-[340px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="space-y-8 p-6 lg:p-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">Style</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Edit settings</h2>
            </div>

            {/* Subtitles */}
            <div className="space-y-5 border-b border-neutral-200 pb-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold">Subtitles</h3>
                  <p className="mt-0.5 text-xs text-neutral-500">Burn captions onto your video</p>
                </div>
                <Toggle checked={subtitles} onChange={setSubtitles} />
              </div>

              <div className={subtitles ? "space-y-6" : "pointer-events-none space-y-6 opacity-40"}>
                {/* Font */}
                <div>
                  <p className="mb-2 text-xs font-medium text-neutral-500">Font</p>
                  <div className="space-y-2">
                    {CAPTION_FONTS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFontId(f.id)}
                        className={`flex w-full items-center justify-between border px-3 py-2.5 text-left transition ${
                          fontId === f.id
                            ? "border-neutral-950 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <span className={`text-lg ${f.className}`}>{f.name}</span>
                        {fontId === f.id && (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <ColorRow label="Font color" value={fontColor} presets={FONT_COLORS} onChange={setFontColor} />
                <ColorRow
                  label="Highlight color (active word)"
                  value={highlightColor}
                  presets={HIGHLIGHT_COLORS}
                  onChange={setHighlightColor}
                />
              </div>
            </div>

            {/* B-roll */}
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-8">
              <div>
                <h3 className="text-sm font-semibold">B-roll images</h3>
                <p className="mt-0.5 text-xs text-neutral-500">Auto-placed above your face · on by default</p>
              </div>
              <Toggle checked={broll} onChange={setBroll} />
            </div>

            {/* Frame border */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold">Frame</h3>
                  <p className="mt-0.5 text-xs text-neutral-500">A border around your video</p>
                </div>
                <Toggle checked={frameEnabled} onChange={setFrameEnabled} />
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-neutral-500">Aspect ratio</p>
                <div className="flex gap-2">
                  {ASPECT_RATIOS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setAspectRatio(r.id)}
                      className={`flex-1 border px-2 py-2 text-xs font-medium transition ${
                        aspectRatio === r.id
                          ? "border-neutral-950 bg-neutral-50"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={frameEnabled ? "space-y-4" : "pointer-events-none space-y-4 opacity-40"}>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-medium text-neutral-500">
                    <span>Border thickness</span>
                    <span>{borderPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={25}
                    step={1}
                    value={borderPct}
                    onChange={(e) => setBorderPct(Number(e.target.value))}
                    className="w-full accent-neutral-950"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {FRAME_STYLES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFrameStyle(f.id)}
                      title={f.label}
                      aria-label={f.label}
                      className={`aspect-video overflow-hidden rounded border transition ${
                        frameEnabled && frameStyle === f.id
                          ? "border-neutral-950 ring-1 ring-neutral-950"
                          : "border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <div className={`relative h-full w-full ${f.border}`}>
                        {f.id === "filmstrip" && <FilmStripHoles />}
                        <div className="absolute bg-neutral-300" style={frameInsetStyle(f.id, borderPct)} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main — upload + live preview */}
        <main className="flex-1 p-6 lg:p-10">
          <div className="mx-auto max-w-2xl">
            {photosResult ? (
              <div>
                <div className="text-center">
                  <h1 className="text-balance text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl">
                    Your video with <span className="font-serif font-normal italic">photos</span>.
                  </h1>
                  <p className="mx-auto mt-4 max-w-md text-sm text-neutral-500">
                    Relevant photos appear on the top 30%, matched to what you say. Press play.
                  </p>
                </div>
                <div className="mt-8">
                  <BrollPreview src={photosResult.src} cues={photosResult.cues} />
                </div>
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setPhotosResult(null);
                      setStatus("idle");
                      setPendingAction(null);
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-950"
                  >
                    Start over
                  </button>
                </div>
              </div>
            ) : (
            <>
            <div className="text-center">
              <h1 className="text-balance text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl">
                Upload your <span className="font-serif font-normal italic">footage</span>.
              </h1>
              <p className="mx-auto mt-4 max-w-md text-sm text-neutral-500">
                Drop in a video of yourself talking. We&apos;ll apply your style and add B-roll automatically.
              </p>
            </div>

            {/* Dropzone / preview */}
            <div className="mt-10">
              {!file ? (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    selectFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`flex w-full flex-col items-center justify-center border-2 border-dashed px-6 py-20 text-center transition-colors ${
                    dragging ? "border-neutral-950 bg-neutral-50" : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center border border-neutral-300">
                    <svg className="h-6 w-6 text-neutral-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                    </svg>
                  </div>
                  <p className="mt-6 text-base font-medium">Drag &amp; drop your video here</p>
                  <p className="mt-1.5 text-sm text-neutral-500">or click to browse — MP4, MOV, or WebM</p>
                </button>
              ) : (
                <div className="border border-neutral-200">
                  <div className="relative w-full bg-black" style={{ aspectRatio: activeAspect.value }}>
                    {previewUrl && frameEnabled ? (
                      <FramedVideo src={previewUrl} frameStyle={frameStyle} borderPct={borderPct} />
                    ) : (
                      previewUrl && (
                        <video src={previewUrl} controls playsInline className="h-full w-full object-contain" />
                      )
                    )}
                    {/* Live caption overlay — sits on the video itself, so it shifts up off the
                        border when a frame is active instead of landing in the frame's margin. */}
                    {subtitles && (
                      <div
                        className="pointer-events-none absolute inset-x-0 flex justify-center px-6 text-center"
                        style={{
                          bottom: frameEnabled
                            ? `${frameBottomPct(activeFramePreset.id, borderPct) + 3}%`
                            : "1.5rem",
                        }}
                      >
                        <CaptionSample fontClass={activeFont.className} color={fontColor} highlight={highlightColor} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-neutral-200 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-neutral-500">{formatSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearFile}
                      disabled={uploading}
                      className="shrink-0 border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e) => selectFile(e.target.files?.[0])} />
            </div>

            {/* Caption preview (always visible so style choices — captions AND frame — are tangible
                even before/without a video uploaded) */}
            <div className="mt-6">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-neutral-400">Caption preview</p>
              <div
                className="relative w-full overflow-hidden border border-neutral-200 bg-neutral-900"
                style={{ aspectRatio: activeAspect.value }}
              >
                {frameEnabled && (
                  <div className={`absolute inset-0 ${activeFramePreset.border}`}>
                    {activeFramePreset.id === "filmstrip" && <FilmStripHoles />}
                    <div
                      className={`absolute bg-neutral-900 ${
                        activeFramePreset.id === "polaroid" ? "shadow-md" : "shadow-inner"
                      }`}
                      style={frameInsetStyle(activeFramePreset.id, borderPct)}
                    />
                  </div>
                )}
                <div
                  className="pointer-events-none absolute inset-x-0 flex justify-center px-6 text-center"
                  style={{
                    bottom: frameEnabled
                      ? `${frameBottomPct(activeFramePreset.id, borderPct) + 3}%`
                      : "1.5rem",
                  }}
                >
                  {subtitles ? (
                    <CaptionSample fontClass={activeFont.className} color={fontColor} highlight={highlightColor} />
                  ) : (
                    <p className="text-sm text-neutral-500">Subtitles are turned off</p>
                  )}
                </div>
              </div>
            </div>

            {error && <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                {/* Captions only */}
                <button
                  type="button"
                  onClick={handleCaptions}
                  disabled={!file || uploading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-8 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  {uploading && pendingAction === "captions" ? (
                    <>
                      <Spinner />
                      {stageLabel}
                    </>
                  ) : (
                    "Add captions"
                  )}
                </button>

                {/* Contextual photos overlaid on the top 30% (no captions) */}
                <button
                  type="button"
                  onClick={handlePhotos}
                  disabled={!file || uploading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-neutral-950 bg-white px-8 py-4 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  {uploading && pendingAction === "photos" ? (
                    <>
                      <Spinner />
                      {stageLabel}
                    </>
                  ) : (
                    "Add photos"
                  )}
                </button>
              </div>
              <p className="text-center text-xs text-neutral-400">
                &ldquo;Add captions&rdquo; burns in subtitles. &ldquo;Add photos&rdquo; overlays images on the
                top 30% matched to your words (no captions). Your footage is private.
              </p>
            </div>
            </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
