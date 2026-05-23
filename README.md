# BestVideo — AI Video Editor (Pivot Spec)

> **Status:** Pivoted 2026-05-23 from text-to-video *generation* to a PunchEdit-style AI video *editor*.
> This document is the architecture & build spec for the new product. The old text-to-video architecture
> is retired (see §12 for the migration map).

---

## 1. Product Overview

**BestVideo** turns **raw talking-head footage into a finished, post-ready video** — no timeline editing.

A creator uploads themselves talking to camera. BestVideo listens to the transcript and automatically:

- **Burns in captions** (styled, animated subtitles)
- **Drops in relevant images / B-roll** placed **above or beside the speaker's face** (never covering it), timed to the keywords they say
- **Cuts** silences and filler words ("um", dead air)
- *(later)* adds **motion graphics** and **background music**

```
Upload raw video → Transcribe → AI plans the edit → Source B-roll → Render (Remotion) → Download
```

It's a **transform** product, not a *generate* product. Your speech drives every edit decision.

---

## 2. Core Features

| Feature | Description |
|--------|-------------|
| **Raw video upload** | Browser uploads large files directly to S3/R2 via presigned/multipart URLs. |
| **Auto transcription** | Word-level timestamps drive captions, cuts, and B-roll timing. |
| **AI edit planning** | An LLM converts the transcript into an **Edit Decision List (EDL)**. |
| **Burned captions** | Styled, animated subtitles rendered onto the video. |
| **Face-aware B-roll** | Relevant stock images/clips placed in the safe zone above/beside the face. |
| **Auto-cut** | Remove silences and filler words. |
| **Re-edit** | User can tweak the EDL and re-render. |
| **Credit/billing system** | Cost metered per minute of video; Stripe top-ups. |
| **Async pipeline** | Multi-stage background workers; the UI shows real progress. |

---

## 3. System Architecture

```
┌──────────────┐  presigned PUT   ┌──────────────┐
│  Browser     │ ───────────────▶ │  S3 / R2     │  (raw upload + final renders)
│  (Next.js)   │                  └──────┬───────┘
└──────┬───────┘                         │
       │ POST /api/projects              │
       ▼                                 │
┌──────────────┐     enqueue      ┌──────▼────────────────────────────────┐
│  API Routes  │ ───────────────▶ │  Queues (BullMQ / Redis)              │
│  (auth,      │                  │  transcribe → plan → source → render  │
│   credits)   │                  └──────┬────────────────────────────────┘
└──────┬───────┘                         │ each stage = a worker
       │                                 ▼
┌──────▼───────┐                  ┌───────────────────────────────────────┐
│ PostgreSQL   │◀────────────────▶│ Workers                               │
│ (Prisma)     │                  │  • transcribe  (Deepgram/AssemblyAI)  │
│ Project/EDL  │                  │  • plan        (LLM → EDL)            │
└──────────────┘                  │  • source      (Pexels/Storyblocks)   │
                                   │  • render      (Remotion)            │
                                   └───────────────────────────────────────┘
```

**Renderer: Remotion** (React-based, self-hosted). Chosen because captions + face-aware overlays need
per-frame pixel control and the stack is React/TS. *Caveat:* Remotion needs a paid company license past
their team/revenue thresholds; render compute runs on the worker or `@remotion/lambda`.

---

## 4. The Edit Pipeline (the heart of the product)

Five stages. Each is a **separate worker / queue** so it can retry independently and update `Project.status`
for granular UI progress.

1. **Upload** — browser → presigned S3/R2. On completion, `POST /api/projects/:id/complete-upload` flips the
   project to `uploaded` and enqueues stage 2. *(not a worker)*
2. **Transcribe** → word-level transcript `[{ word, start, end }]`. Also run a **face-detection pass** to get the
   face bounding box over time (the "safe zone"). → status `planning`.
3. **Plan** → an LLM reads the transcript and emits the **EDL**: spans to cut, B-roll cues
   (`keyword + time range + search query`), caption styling. → status `sourcing`.
4. **Source B-roll** → for each cue, search a stock provider, download the best match, store it. → status `rendering`.
5. **Render** → Remotion composes: cut source per EDL + burn captions + overlay B-roll in the face-safe zone
   (+ later music/graphics) → upload final → `Render.completed`, `Project.ready`, **deduct credits**.

### EDL shape (stored as JSON on `Project.edl`)

```jsonc
{
  "cuts":   [{ "start": 12.4, "end": 13.1, "reason": "silence" }],
  "broll":  [{ "id": "b1", "start": 5.0, "end": 8.0, "keyword": "rocket",
               "query": "rocket launch", "position": "above-face" }],
  "captions": { "style": "bold-yellow", "maxWordsPerLine": 4 },
  "graphics": [],                                   // phase 3
  "music":    null                                  // phase 3
}
```

---

## 5. Data Model (Prisma)

`VideoJob`/`ImageJob` (prompt-centric) are replaced by an upload-centric `Project` with child assets/renders.

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  credits   Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  projects     Project[]
  transactions Transaction[]
}

enum ProjectStatus {
  created       // row exists, awaiting upload
  uploaded      // raw video in storage
  transcribing
  planning
  sourcing      // fetching b-roll
  rendering
  ready
  failed
}

model Project {
  id           String        @id @default(cuid())
  userId       String
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  title        String?
  status       ProjectStatus @default(created)
  sourceKey    String?       // S3 key of raw upload
  sourceUrl    String?
  durationSec  Float?
  transcript   Json?         // [{ word, start, end }]
  faceTrack    Json?         // [{ t, x, y, w, h }] face safe-zone over time
  edl          Json?         // Edit Decision List (see §4)
  errorMessage String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  completedAt  DateTime?
  brollAssets  BrollAsset[]
  renders      Render[]
  @@index([userId])
  @@index([status])
}

model BrollAsset {
  id         String   @id @default(cuid())
  projectId  String
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  cueId      String   // matches an EDL broll cue id
  keyword    String
  source     String   // "pexels" | "storyblocks" | "generated"
  sourceUrl  String
  storageKey String?
  startSec   Float
  endSec     Float
  position   String   @default("above-face")
  createdAt  DateTime @default(now())
  @@index([projectId])
}

enum RenderStatus { queued rendering completed failed }

model Render {
  id           String       @id @default(cuid())
  projectId    String
  project      Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  version      Int          @default(1)
  status       RenderStatus @default(queued)
  outputKey    String?
  outputUrl    String?
  creditsUsed  Int          @default(0)
  errorMessage String?
  createdAt    DateTime     @default(now())
  completedAt  DateTime?
  @@index([projectId])
}

enum TransactionType { signup purchase consumption refund }

model Transaction {
  id        String          @id @default(cuid())
  userId    String
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  amount    Int             // + add, - deduct
  type      TransactionType
  projectId String?
  renderId  String?
  createdAt DateTime        @default(now())
  @@index([userId])
}
```

---

## 6. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|--------|
| **POST** | `/api/projects` | Create project; return `{ projectId, uploadUrl }` (presigned PUT / multipart init). |
| **POST** | `/api/projects/:id/complete-upload` | Mark `uploaded`, enqueue transcription. |
| **GET** | `/api/projects` | List the user's projects (status + thumbnails). |
| **GET** | `/api/projects/:id` | Project detail: status, transcript, EDL, B-roll, renders. |
| **PATCH** | `/api/projects/:id/edl` | User edits the plan (re-edit UI). |
| **POST** | `/api/projects/:id/render` | (Re)render with current EDL; enqueue a new `Render`. |
| **GET** | `/api/user/credits` | Current credit balance. *(kept)* |
| **POST** | `/api/buy-credits` | Stripe checkout for credits. *(kept)* |
| **POST** | `/api/webhook/stripe` | Stripe webhook → add credits. *(kept)* |

All authenticated routes load `userId` first (via `lib/auth.ts`), and reuse the existing rate-limit +
idempotency helpers.

---

## 7. Background Workers

A queue per stage; each handler updates `Project.status` and enqueues the next stage on success.

| Worker | In | Out |
|--------|----|----|
| `transcribe-worker` | `uploaded` | transcript + faceTrack saved → `planning`, enqueue plan |
| `plan-worker` | `planning` | LLM → `edl` saved → `sourcing`, enqueue source |
| `source-worker` | `sourcing` | B-roll fetched & stored → `rendering`, enqueue render |
| `render-worker` | `rendering` | Remotion render → upload → `Render.completed`, `Project.ready`, **deduct credits** |

On any stage failure: set `Project.status = failed` + `errorMessage`; refund if credits were reserved.
Reuse the existing in-memory-vs-Redis queue switch in `lib/queue.ts`.

---

## 8. Rendering with Remotion

A single Remotion **composition** takes props and renders the final MP4:

```ts
type EditProps = {
  sourceVideoUrl: string;
  cuts: Cut[];                 // trim/concat the source
  captions: CaptionWord[];     // from transcript, styled
  broll: BrollClip[];          // { url, start, end, position }
  faceTrack: FaceBox[];        // place broll in the safe zone above/beside the face
  music?: { url: string; gainDb: number };
};
```

- **Captions:** `@remotion/captions` (or render words from the transcript) with timed highlighting.
- **Face-aware placement:** `faceTrack` (from stage 2) gives the face box per frame; B-roll is positioned in the
  free space above/beside it so it never covers the speaker.
- **Cuts:** sequence trimmed `<OffthreadVideo>` segments per the EDL `cuts`.
- **Render:** `@remotion/renderer` in the `render-worker` for the MVP; move to `@remotion/lambda` for scale.
- **License:** confirm Remotion's company-license terms before launch.

---

## 9. Storage & Upload

Extend `lib/storage.ts` (today it only does server-side `PutObject`) with:

- `presignedPutUrl(key, contentType)` — browser uploads raw video directly (no proxy through the API).
- **Multipart** init/complete helpers for large files.
- Keep `uploadVideo()` (used by the render-worker to store final output) and `getSignedUrl()`.

Validate on URL issue: allowed content types (`video/mp4`, `video/quicktime`…) and a max size cap.

---

## 10. Credits / Cost Model

Flat "10 credits/video" no longer fits — cost scales with **video length** (transcription + LLM + stock API +
render compute). Switch to **credits per minute of source video**, charged on a **successful render**.

```ts
export const CREDITS_PER_MINUTE = 10;   // tune to cover cost + margin
export const SIGNUP_CREDITS = 50;
```

`lib/credits.ts` already takes an arbitrary `amount`, so this is a pricing change, not a rewrite. Deduct in
`render-worker`; refund on failure.

---

## 11. Security

| Area | Measure |
|------|---------|
| **Upload abuse** | Presigned URLs scoped to content-type + size cap; rate-limit `POST /api/projects`. |
| **Content moderation** | Run the **transcript** through `services/moderation.ts` before/at the plan stage. |
| **API keys** | Transcription / stock / LLM keys server-side only (workers). |
| **Webhooks** | Verify Stripe signature before crediting. |
| **Auth** | Validate `userId` on every project route; users only see their own projects. |

---

## 12. Migration Map (from the old text-to-video app)

| File / area | Action |
|---|---|
| `lib/auth.ts`, `lib/db.ts`, `lib/stripe.ts`, `subscribe.ts` | **Keep** |
| `lib/credits.ts` | **Keep**, retune to per-minute (§10) |
| `utils/idempotency.ts`, `utils/rate-limit.ts` | **Keep** |
| `lib/queue.ts` + worker pattern | **Keep**, extend to per-stage queues (§7) |
| `lib/storage.ts` | **Extend** with presigned/multipart (§9) |
| `services/moderation.ts` | **Repurpose** to moderate transcript |
| `app/api/generate-video/`, `app/api/generate-image/`, `job/`, `job-image/` | **Replace** with `app/api/projects/…` |
| `workers/video-worker.ts`, `image-worker.ts` | **Replace** with the 4 stage workers |
| `services/video-generation.ts`, `services/image-generation.ts` | **Delete** |
| `app/create-video/`, `app/create-image/` | **Replace** with upload + review/editor UI |
| `db/schema.prisma` (`VideoJob`/`ImageJob`) | **Replace** with §5 models |

---

## 13. Build Roadmap

### Phase 0 — Spine on real video *(prove it works)*
- New Prisma schema (§5) + migrate.
- Presigned upload (`lib/storage.ts`) + `POST /api/projects` + `complete-upload`.
- `transcribe-worker` (Deepgram or AssemblyAI) → save transcript.
- `GET /api/projects/:id` returns the transcript.
- **Done when:** upload a video → see its word-level transcript.

### Phase 1 — MVP *(sellable: "clean up + caption my video")*
- `plan-worker`: silence/filler-word cuts → EDL.
- Remotion composition: trimmed source + **burned captions**.
- `render-worker` + `POST /api/projects/:id/render` → downloadable MP4.
- **Done when:** upload → get back a tightened, captioned video.

### Phase 2 — Face-aware B-roll
- Face-detection pass (stage 2) → `faceTrack`.
- `plan-worker` emits B-roll cues; `source-worker` (Pexels) fetches them.
- Remotion overlays B-roll above/beside the face.

### Phase 3 — Polish
- Motion graphics + background music; re-edit UI (`PATCH /edl` + re-render).

### Phase 4 — Scale & billing
- Per-minute credit model live; `@remotion/lambda`; multiple workers; CDN for outputs.

---

## 14. Folder Structure (target)

```
my-app/
├── app/
│   ├── api/
│   │   ├── projects/
│   │   │   ├── route.ts                 # POST create, GET list
│   │   │   └── [id]/
│   │   │       ├── route.ts             # GET detail
│   │   │       ├── complete-upload/route.ts
│   │   │       ├── edl/route.ts         # PATCH
│   │   │       └── render/route.ts      # POST
│   │   ├── user/credits/route.ts        # kept
│   │   ├── buy-credits/route.ts         # kept
│   │   └── webhook/stripe/route.ts      # kept
│   ├── projects/                        # upload + review/editor UI
│   └── page.tsx
├── remotion/
│   └── EditComposition.tsx              # the render composition
├── services/
│   ├── transcription.ts                 # Deepgram/AssemblyAI
│   ├── face-detect.ts                   # face track
│   ├── edit-planner.ts                  # LLM → EDL
│   ├── broll.ts                         # stock search + fetch
│   └── moderation.ts                    # kept (transcript)
├── workers/
│   ├── transcribe-worker.ts
│   ├── plan-worker.ts
│   ├── source-worker.ts
│   ├── render-worker.ts
│   └── run-worker.ts                    # boots all queues
├── lib/  (auth, db, queue, storage, credits, stripe — kept/extended)
└── db/schema.prisma
```

---

## 15. Environment Variables (new/changed)

```
# kept
DATABASE_URL=
REDIS_URL=
S3_BUCKET= S3_REGION= S3_ENDPOINT= AWS_ACCESS_KEY_ID= AWS_SECRET_ACCESS_KEY=
STORAGE_PUBLIC_BASE_URL=
STRIPE_SECRET_KEY= STRIPE_WEBHOOK_SECRET=

# new
TRANSCRIPTION_PROVIDER=deepgram        # or assemblyai
DEEPGRAM_API_KEY=
EDIT_PLANNER_PROVIDER=anthropic        # LLM for the EDL
ANTHROPIC_API_KEY=
PEXELS_API_KEY=                        # B-roll source (phase 2)
REMOTION_AWS_REGION=                   # if using @remotion/lambda (phase 4)
```
```bash
cp .env.example .env
npm install
npx prisma generate && npx prisma db push
npm run dev          # API + in-memory queue
npm run worker       # stage workers (needs REDIS_URL)
```
