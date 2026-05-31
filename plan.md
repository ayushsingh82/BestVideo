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

## ⚠️ ZapCap limitations (important)

- **Watermark on output.** The free tier burns a **ZapCap watermark** into the rendered video. Removing it requires a paid plan.
- **Captions are styled ZapCap's own way (template-driven).** We pick a **templateId** and ZapCap controls the look. We **cannot freely choose font color, highlight color, font, or position** through the basic API flow.
- **Sidebar style controls are visual-only.** The font / font-color / highlight-color / B-roll toggles on `/create-video` are **not yet wired** to the render — output style comes entirely from the chosen ZapCap template.
- **Needs audible speech.** Captions come from transcription, so a silent clip (or a photo) produces **no captions**.
- **Free quota is small** (~3 minutes of video total). Mind it when testing.

## Next steps / TODO

- [ ] Decide: stay on ZapCap (accept watermark + template styling) vs. build our own engine.
- [ ] Own-engine option for full style control + no watermark: **Whisper/AssemblyAI** (word timestamps) + **Remotion** (render) — lets us honor the sidebar font/color/B-roll controls exactly.
- [ ] If staying on ZapCap: map sidebar selections → ZapCap `renderOptions` where supported, and surface a paid-plan path to drop the watermark.
- [ ] Persist projects (DB) + auth so users can revisit past captioned videos.
