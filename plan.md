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

---

### 1. Standalone transcription (unblocks everything below)
**Goal:** Remove ZapCap dependency from "Add photos" — faster, no watermark wasted, no quota burned.

- [ ] `services/transcribe.ts` — call **OpenAI Whisper** (`whisper-1`) with `response_format: verbose_json` + `timestamp_granularities: ["word"]`. Returns `{ text, start, end }[]`.
- [ ] `POST /api/transcribe` — accepts `multipart/form-data` with the video file, proxies to Whisper, returns words array.
- [ ] Update `handlePhotos` in `create-video/page.tsx` to POST directly to `/api/transcribe` instead of going through ZapCap. Skip `startProject` + `waitForTranscript`.
- [ ] Update `/api/broll/route.ts` to accept a `words` array body (in addition to `transcriptUrl`) so it works with both sources.
- [ ] Add `OPENAI_API_KEY` to `.env.local`.

**Result:** "Add photos" goes from ~2 min (ZapCap render) to ~10s (Whisper only).

---

### 2. Smart content placement — don't cover the face
**Goal:** Place B-roll images where the speaker is NOT, not just blindly at top-30%.

**The problem now:** `BrollPreview` hardcodes `top-0 h-[30%]`. For portrait videos with face centered or near top, this covers the face. For landscape videos it's fine but wastes the wrong zone.

**Plan:**

#### 2a. Face zone detection (server-side, one-time per video)
- [ ] `POST /api/detect-face` — takes the video URL/file, extracts a single mid-video frame (ffmpeg `ss` flag or sharp), runs it through a face detection model.
  - Option A (free, no infra): **@vladmandic/face-api** running in Node — works in worker, no external API.
  - Option B (simple): **AWS Rekognition** `DetectFaces` — 5000 free calls/month, returns bounding box as % of frame.
  - **Recommended: Option A** (no cost, no extra API key).
- [ ] Returns `{ faceZone: { top, left, width, height } }` as fractions (0–1) of frame dimensions.
- [ ] If no face detected, return `{ faceZone: null }` — fall back to top-30% default.

#### 2b. Safe zone computation
- [ ] `utils/safe-zone.ts` — given `faceZone` + video aspect ratio, compute where there's enough empty space to place an image:
  - Portrait (9:16): face is usually center-bottom. Safe zone = **top 25%** above the face, or two side strips if face is centered vertically.
  - Landscape (16:9): face is usually center. Safe zone = **left or right third** (pick whichever has more margin from face center).
  - No face: default to top-30% (current behavior).
- [ ] Output: `{ position: 'top' | 'bottom' | 'left' | 'right', rect: { x, y, w, h } }` as % of frame.

#### 2c. Pass safe zone to `BrollPreview`
- [ ] `BrollPreview` accepts an optional `safeZone` prop instead of hardcoding `top-0 h-[30%]`.
- [ ] Apply `safeZone.rect` as `style={{ top, left, width, height }}` on the image overlay div.
- [ ] Smooth transition: add `transition-opacity duration-300` when image swaps so it doesn't flash.

---

### 2.5. Canvas / backdrop mode
**Goal:** Shrink the source video to fit inside a larger frame instead of filling it edge-to-edge,
with the surrounding space showing a backdrop — the "video floating on a background" look common
in tutorial/talking-head edits (CapCut calls this "canvas").

**Chosen backdrop styles (user picked both, 2026-07-25):**
- [x] **Blurred video** — the same video, scaled up + CSS-blurred, playing behind the sharp shrunk
  version (the Instagram Story technique — two `<video>` elements, same `src`, kept in sync).
- [x] **Custom image/wallpaper** — user uploads a background image (desktop wallpaper, branded
  backdrop, etc.) shown behind the shrunk video instead.
- [x] Live preview shipped on `/create-video`: new "Canvas backdrop" sidebar section (toggle +
  blur/image choice + image upload), wired into the main preview frame.
- [ ] Carry the same composition into `BrollPreview` and the eventual Remotion render (item 4) —
  not done yet, this is preview-only so far, same status as B-roll ("live preview, not yet burned
  into a downloadable MP4").
- [ ] Consider a size/position control (how much the video shrinks, where it sits in the frame)
  instead of a fixed shrink percentage.

---

### 3. Smarter keyword → image matching
**Goal:** Replace stopword-filter keywords with visual nouns that actually have good stock photos.

**The problem now:** Words like "going", "down", "expensive" pass the stopword filter but return useless/random images. We need nouns and entities — things you can photograph.

- [ ] `POST /api/keywords` — takes the full transcript text + word timestamps, calls **Claude claude-haiku-4-5** with a prompt:
  > "From this transcript, extract 8–12 visual nouns or concrete entities (people, objects, places, actions you can photograph). Return as JSON array: `[{ keyword, startTime, endTime, context }]`. Prefer specific over generic (e.g. 'mountain bike' over 'thing'). Skip abstract words."
- [ ] Map each LLM keyword back to the nearest word timestamp from Whisper output to get precise `start`/`end`.
- [ ] Update `/api/broll` to accept either `transcriptUrl` (old ZapCap path) or `{ words, text }` (new path), run LLM keyword extraction, then image search.
- [ ] Query expansion: if Pexels returns 0 results for a keyword, retry with a broader term (e.g. "mountain biking" → "cycling" → "sport").

---

### 4. Burned-in downloadable output (Remotion)
**Goal:** Composite captions + B-roll photos into a real MP4 the user can download.

- [ ] Install Remotion: `@remotion/core`, `@remotion/player`, `@remotion/lambda` (or local render for MVP).
- [ ] `remotion/VideoComposition.tsx` — Remotion composition that:
  - Plays the source video as background (`<Video>`).
  - Renders word-by-word captions as `<AbsoluteFill>` with `useCurrentFrame` + word timestamps from Whisper.
  - Shows B-roll images using `safeZone.rect` positioning + fade in/out using `spring()`.
- [ ] `POST /api/render` — takes `{ projectId }`, triggers Remotion render (local worker for MVP, lambda for scale), returns a job ID.
- [ ] Poll render status → serve the output MP4 via presigned S3 URL with a Download button.
- [ ] Caption style (font, color, highlight) wired from sidebar settings → Remotion props.

---

### 5. Persistence + project history
- [ ] DB + auth so transcript, safe zone, cues, and render URL are cached per project.
- [ ] Users can revisit past projects without re-transcribing or re-rendering.

---

### 6. Reference-style analyzer — paste a URL, get its edit-style profile
**Goal:** User pastes a YouTube URL (or, later, uploads their own reference clip) → we show the
video and produce a "style profile" (pacing, caption cadence, speaking rate) describing how it's
edited. Eventually that profile drives the B-roll/caption knobs (`PHOTO_DURATION_S`,
`MIN_SPACING_S`, `TARGET_PHOTOS` in `app/api/broll/route.ts`) so a user's own footage gets edited
in the same style as the reference.

#### Phase 1 — transcript-timing proxy (shipped)
- [x] `/analyze-style` page: paste a YouTube URL, embed plays the video.
- [x] `POST /api/analyze-style` — given a YouTube URL:
  - Parse the video ID (supports `watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`).
  - Fetch title/author via YouTube oEmbed (no key needed).
  - Fetch the caption track (manual or auto-generated) via the **`yt-dlp`** CLI (installed:
    `brew install yt-dlp`), not raw `fetch` — YouTube's plain `timedtext`/InnerTube endpoints now
    require a signed, single-use session that can't be replicated with a bare HTTP call, so we
    shell out to the tool that keeps up with that instead of re-fighting it ourselves. No video is
    downloaded, only the subtitle file (`srv1`), into a temp dir that's cleaned up after.
  - Compute pacing metrics from caption segment timing: avg caption duration, captions/minute,
    speaking rate (wpm), gap analysis (silence/pause frequency).
  - Classify into a pacing bucket (fast / medium / slow) with a plain-English summary.
- **Infra dependency:** requires `yt-dlp` on PATH in every environment this runs (dev machine ✅;
  add to prod/deploy setup — Vercel serverless would need it bundled or moved to a worker).
- **Known limitation:** this is a *proxy* for editing style via caption cadence — it does NOT see
  actual cuts, B-roll images, or motion graphics. Videos with no captions available (many
  entertainment/vlog channels disable them) return a graceful "no captions" message, not a crash.

#### Phase 2 — real visual analysis (future, needs new infra)
- [ ] Needs `ffmpeg`/`yt-dlp` (system binaries, not yet installed) to download + sample frames.
- [ ] Scene-detection (`ffmpeg` `select='gt(scene,0.4)'`) for actual cut timestamps → real shot length.
- [ ] Frame sampling + a vision-capable LLM (Claude) to classify each segment as talking-head /
  B-roll / text-overlay / animation, and measure how long each stays on screen.
- [ ] Merge into one "style profile" JSON: cut pace, B-roll frequency + duration, caption density,
  animation/energy level.
- [ ] Feed that profile into `/api/broll` as overrides for the hardcoded constants, and (once
  Remotion rendering ships in item 4) into caption styling too.
- **Caveat:** downloading arbitrary YouTube videos for analysis has ToS/copyright considerations —
  scope this to the user's own upload or a video they have rights to, not arbitrary scraping.

## Working agreement

- **When the user says "continue work" / "continue further" (or similar), READ THIS `plan.md` first** and pick up the next unchecked roadmap item (top-down), unless told otherwise.
- Keep this file updated as items ship: check off done items and add new findings.
