# BestVideo — Plan & Notes

PunchEdit-style AI video editor. Upload a talking-head clip → get captions burned in.

## Current state (demo1)

Captioning works end-to-end via **ZapCap**:

- `/create-video` — upload page with an **"Add captions"** button.
- `POST /api/projects` — sends the uploaded file straight to ZapCap, starts a caption task, returns a `projectId` (`videoId__taskId`). No DB / S3 / Redis needed — ZapCap holds the job state.
- `GET /api/projects/[id]` — polls ZapCap task status (proxied so the API key stays server-side).
- `/projects/[id]` — polls status, then plays the captioned video with a Download button.
- `services/captioning.ts` — ZapCap client (`startCaptionJob`, `getCaptionStatus`, `captionVideo`, `listTemplates`).
- `scripts/demo-caption.ts` — CLI demo (`npm run demo:caption <url>`).

Config in `.env.local`: `ZAPCAP_API_KEY`, optional `ZAPCAP_TEMPLATE_ID` (default = "Hormozi 3").

## B-roll photos ("Add photos" button) — our own layer

ZapCap's auto B-roll is **paid-only** (free tier silently ignores `brollPercent`), and even paid placement is template-controlled. So photos are built ourselves:

- **"Add photos"** on `/create-video`: upload → transcribe (via ZapCap) → match images to keywords → **overlay on the top 30% of the ORIGINAL video** (no captions, no watermark), synced to speech. Live preview, not yet a burned-in MP4.
- `POST /api/broll` — takes the transcript URL, picks keyword moments (uses ZapCap's `important: true` word flags), searches **Pexels** (primary, high quality) with **Openverse** as keyless fallback, returns timed cues `{ start, end, query, imageUrl }`.
- Each photo shows **2–3s** and only while there's text (never lingers over silence). Targets ~6–8 distinct photos. Tuning knobs in `app/api/broll/route.ts`: `PHOTO_DURATION_S`, `MIN_SPACING_S`, `TARGET_PHOTOS`.
- `BrollPreview` component plays the local video and swaps the top-30% image as the playhead hits each cue.
- Config: `PEXELS_API_KEY` in `.env.local` (free key at https://www.pexels.com/api/). Without it, falls back to Openverse.

## How "Add photos" works for ANY uploaded video (the real, blind flow)

The test runs above reused a cached transcript, but **nothing is hardcoded** — every upload is transcribed fresh. The end-to-end path for an arbitrary user upload:

1. **Upload** → `POST /api/projects` streams the file to ZapCap.
2. **Transcribe** → poll `GET /api/projects/[id]` until ZapCap finishes; it returns `transcriptUrl` (a `words.json` with per-word `start`/`end` timestamps + `important` flags).
3. **Extract keywords + match images** → `POST /api/broll` with that `transcriptUrl`:
   - parse words → drop stopwords/numbers → prefer `important` words → dedupe → evenly sample across the timeline.
   - for each keyword, search Pexels/Openverse → build a 2–3s cue.
4. **Overlay** → browser plays the original video and shows each photo on the top 30% during its cue window.

So keywords are fetched **from the video itself** at upload time; the user's speech drives which photos appear and when.

### Known limitation (the thing to fix next)

We currently use ZapCap **only to get the transcript**, which means waiting for ZapCap's full render (~1–3 min), spending free quota, and producing a watermarked video we then discard. This is the biggest inefficiency.

## ⚠️ ZapCap limitations (important)

- **Watermark on output.** The free tier burns a **ZapCap watermark** into the rendered video. Removing it requires a paid plan.
- **Captions are styled ZapCap's own way (template-driven).** We pick a **templateId** and ZapCap controls the look. We **cannot freely choose font color, highlight color, font, or position** through the basic API flow.
- **Sidebar style controls are visual-only.** The font / font-color / highlight-color / B-roll toggles on `/create-video` are **not yet wired** to the render — output style comes entirely from the chosen ZapCap template.
- **Needs audible speech.** Captions come from transcription, so a silent clip (or a photo) produces **no captions**.
- **Free quota is small** (~3 minutes of video total). Mind it when testing.

## Roadmap (prioritized — work top-down)

### 1. Standalone transcription (unblocks fast, ZapCap-free "Add photos")
- [ ] Add a transcription provider — **OpenAI Whisper** (`whisper-1`, word timestamps) or **AssemblyAI**.
- [ ] New `services/transcribe.ts` + `POST /api/transcribe` that takes the uploaded file and returns `words.json`-shaped data (`{ text, start, end, important? }`).
- [ ] Point `/api/broll` at our transcript instead of ZapCap's `transcriptUrl`.
- [ ] Result: "Add photos" no longer uploads to ZapCap, no watermark, no wasted render, much faster.

### 2. Smarter keyword → image relevance
- [ ] Pick **visual nouns / entities** (NER or a quick LLM pass) instead of raw `important` words — skip abstract words like "down", "expensive".
- [ ] Query expansion + orientation match (landscape image for landscape video, etc.).
- [ ] Optional AI-generated images (Flux Schnell via Replicate) when stock has no good match.

### 3. Burned-in, downloadable output
- [ ] Composite the overlay into a real MP4 (Shotstack / Remotion / ffmpeg) so users can download, not just preview.
- [ ] Combine **captions + photos** in one output.

### 4. Captions polish (ZapCap path)
- [ ] Wire the sidebar font / color / highlight controls → ZapCap `renderOptions` (currently visual-only).
- [ ] Surface a paid-plan path to drop the ZapCap watermark.

### 5. Persistence
- [ ] DB + auth so users can revisit past projects (transcript + cues cached per project, so re-runs don't re-transcribe).

## Working agreement

- **When the user says "continue work" / "continue further" (or similar), READ THIS `plan.md` first** and pick up the next unchecked roadmap item (top-down), unless told otherwise.
- Keep this file updated as items ship: check off done items and add new findings.
