"use client";

import { useRef, useState } from "react";
import { Navbar } from "@/app/components/Navbar";

type Status = "idle" | "uploading" | "done" | "error";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CreateVideoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  async function handleUpload() {
    if (!file) return;
    setStatus("uploading");
    setError(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";

      // 1. Create the project + get a presigned upload URL.
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: file.name, contentType: file.type, ext }),
      });
      if (!createRes.ok) throw new Error(`Couldn't start the project (${createRes.status}).`);
      const { projectId, uploadUrl } = (await createRes.json()) as {
        projectId: string;
        uploadUrl: string;
      };

      // 2. Upload the raw video straight to storage.
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error(`Upload failed (${putRes.status}).`);

      // 3. Tell the API the upload is done — kicks off transcription + editing.
      await fetch(`/api/projects/${projectId}/complete-upload`, { method: "POST" });

      setStatus("done");
      window.location.href = `/projects/${projectId}`;
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  const uploading = status === "uploading";

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-950 antialiased">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-36 sm:px-6 sm:pt-44">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">New project</p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Upload your <span className="font-serif font-normal italic">footage</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base text-neutral-500">
            Drop in a video of yourself talking. We&apos;ll add captions, B-roll, and clean cuts
            automatically.
          </p>
        </div>

        {/* Dropzone / preview */}
        <div className="mt-12">
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
                dragging
                  ? "border-neutral-950 bg-neutral-50"
                  : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
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
              {previewUrl && (
                <video src={previewUrl} controls playsInline className="aspect-video w-full bg-black object-contain" />
              )}
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

          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => selectFile(e.target.files?.[0])}
          />
        </div>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Action */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-8 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {uploading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading…
              </>
            ) : (
              "Upload & start editing"
            )}
          </button>
          <p className="text-xs text-neutral-400">Your footage is private — only you can see your projects.</p>
        </div>
      </main>
    </div>
  );
}
