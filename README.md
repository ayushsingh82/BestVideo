# BestVideo — Architecture & Backend Documentation

**BestVideo** is a SaaS platform that converts text prompts into AI-generated videos. This document focuses on **architecture, backend logic, APIs, token system, workflow, and infrastructure** — not UI or styling.

---

## 1. Project Overview

### What the platform does

**BestVideo** is a **SaaS** that lets users submit **text prompts** and receive **AI-generated videos**. The system uses external AI video generation APIs (Runway, Pika, Stability AI, Replicate, etc.) to render videos asynchronously. Users can view history, manage prompts, and download or share generated videos.

### Core flow

```
User enters prompt → Job queued → AI generates video → Video stored → User downloads / shares / exports
```

- **Input:** Free-form or structured text prompt (e.g. “A cat walking in the rain, cinematic”).
- **Processing:** Backend validates the user, checks credits, enqueues a job, and a worker calls the chosen AI provider.
- **Output:** Video file in cloud storage; user gets a link to view, download, or share.

---

## 2. Core Features

| Feature | Description |
|--------|-------------|
| **Text-to-video generation** | Submit a prompt; receive a video URL when generation completes. |
| **Prompt management** | Store, list, and optionally edit prompts per user. |
| **Video history** | List of past jobs with status, prompt, and video URL. |
| **Token/credit system** | Each generation consumes credits; sign-up can grant free credits; paid top-ups available. |
| **API-based rendering** | All video creation goes through external AI video APIs (no in-house GPU). |
| **Async processing queue** | Jobs run in background workers so HTTP requests don’t time out. |
| **User authentication** | Identify users for credits, history, and billing. |
| **Export/download** | Serve or redirect to stored video for download or embedding. |

---

## 3. System Architecture

### High-level diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  API Routes /    │────▶│  Queue (Redis/  │
│   (Frontend)    │     │  Server Actions  │     │  BullMQ/Inngest)│
└─────────────────┘     └────────┬─────────┘     └────────┬────────┘
                                 │                        │
                                 │                        ▼
                                 │               ┌─────────────────┐
                                 │               │ Background      │
                                 │               │ Worker(s)       │
                                 │               └────────┬────────┘
                                 │                        │
                                 ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   PostgreSQL    │◀───▶│  Next.js API     │     │  AI Video APIs   │
│   (Prisma)      │     │  (Auth, Credits, │     │  Runway/Pika/    │
└─────────────────┘     │   Jobs, Storage) │     │  Replicate/etc  │
                        └────────┬─────────┘     └────────┬────────┘
                                 │                        │
                                 ▼                        ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  S3 / R2         │◀────│  Worker uploads │
                        │  (Video storage) │     │  completed video│
                        └──────────────────┘     └─────────────────┘
```

### Components

#### Frontend

- **Next.js** application (App Router).
- Serves UI for prompt input, job status, video history, and account/credits.
- No backend logic in this doc; UI is out of scope here.

#### Backend

- **Next.js API routes** or **server actions** for:
  - Auth (session, JWT, or provider).
  - Credits: check balance, deduct on success, add on purchase.
  - Jobs: create job, enqueue, update status, return job/video info.
  - Storage: signed URLs or redirects for download.
- All persistence via **Prisma** and **PostgreSQL**.

#### AI providers (examples)

- **Runway** (Gen-3, etc.)
- **Pika**
- **Stability AI** (video models)
- **OpenAI** (video models when available)
- **Replicate** (e.g. Stable Video Diffusion, other community models)

Provider is chosen per plan or per request; worker calls the right API and handles polling or webhooks.

#### Storage

- **Object storage** for final videos: **AWS S3** or **Cloudflare R2**.
- Store prompt and metadata in **PostgreSQL**; store only the object key/URL in DB.

#### Database

- **PostgreSQL** for users, credits, jobs, and transactions.
- **Prisma ORM** for schema, migrations, and type-safe access.

#### Queue system

Video generation can take minutes. Requests must not hold open an HTTP connection; instead:

1. API creates a **job** in DB and pushes it to a **queue**.
2. A **worker** consumes the queue, calls the AI API, waits (poll or webhook), uploads the video, updates the job, and deducts credits.

**Options:**

- **BullMQ** (Redis-backed, Node-friendly).
- **Redis Queue** (generic Redis list + worker).
- **Inngest** (hosted, event-driven, good for Next.js).
- **Trigger.dev** (background jobs for Next.js).

---

## 4. Token / Credit System

### Idea

- One **credit** (or token) = one unit of consumption (e.g. **10 credits = 1 video**).
- New users get **free credits** (e.g. 50 credits).
- Generating a video **deducts** credits when the job **succeeds**.
- Users can **buy** more credits via **POST /api/buy-credits** (Stripe, etc.).

### Main tables

| Table | Purpose |
|-------|--------|
| **Users** | `id`, `email`, `credits` (current balance), auth fields. |
| **Credits** | Optional ledger: `userId`, `amount`, `reason` (signup, purchase, consumption), `createdAt`. |
| **VideoJobs** | `id`, `userId`, `prompt`, `status`, `creditsReserved` or `creditsDeducted`, `videoUrl`, timestamps. |

### Flow

1. **Sign up** → Insert user with initial `credits` (e.g. 50).
2. **Create job** → Check `user.credits >= costPerVideo`; if not, return 402 or 400.
3. **Enqueue job** → Optionally reserve credits (e.g. decrement by cost, mark job as “pending”); or deduct only on success.
4. **Worker success** → If not reserved: deduct credits; update job with `videoUrl` and `status = completed`.
5. **Worker failure** → If credits were reserved, refund; set job `status = failed`.

### Abuse and failures

- **Rate limiting:** Per-user and per-IP limits on `POST /api/generate-video` (e.g. 5 req/min).
- **Idempotency:** Use a client idempotency key so double-clicks don’t create two jobs or deduct twice.
- **Deduct on success only:** Deduct credits only after video is stored and job is marked completed; on timeout/error, no deduction (or refund if reserved).
- **Webhook verification:** Verify webhook signatures from the AI provider before updating job or deducting credits.
- **Prompt moderation:** Run prompts through a moderation API (e.g. OpenAI Moderation) before enqueueing.

---

## 5. Video Generation Workflow

### Lifecycle (sequence)

```
1. User submits prompt (POST /api/generate-video)
2. API: validate body, auth, prompt moderation
3. API: check user credits >= cost
4. API: create VideoJob (status: queued), optionally reserve credits
5. API: add job to queue (jobId, userId, prompt, provider, options)
6. API: return 202 + jobId
7. Worker: pick job from queue
8. Worker: call AI video API (e.g. Runway) with prompt
9. Worker: wait (poll or webhook) for completion
10. Worker: download video from provider or get URL
11. Worker: upload video to S3/R2, get permanent URL
12. Worker: update VideoJob (status: completed, videoUrl)
13. Worker: deduct credits (if not reserved)
14. Worker: optional — notify user (email, push, or in-app poll)
15. User: GET /api/video/:id or GET /api/user/videos → sees videoUrl and can download
```

### Status flow

```
queued → processing → completed
                   → failed
```

- **queued:** In queue, not yet sent to AI.
- **processing:** Sent to AI provider; waiting for result.
- **completed:** Video stored; `videoUrl` set; credits deducted.
- **failed:** Error or timeout; credits refunded if reserved.

---

## 6. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|--------|
| **POST** | `/api/generate-video` | Submit prompt; validate, check credits, create job, enqueue; return `jobId`. Body: `{ prompt, options? }`. |
| **GET** | `/api/video/:id` | Return job by id (metadata + `videoUrl` if completed). Auth: own job or admin. |
| **GET** | `/api/user/videos` | List current user’s jobs (paginated) with status and `videoUrl`. |
| **POST** | `/api/webhook/video-ready` | Provider webhook when video is ready; verify signature; update job, upload to S3/R2, deduct credits. |
| **POST** | `/api/buy-credits` | Purchase credits (e.g. Stripe Checkout); on success, increment `user.credits` and optionally log in Transactions. |
| **GET** | `/api/user/credits` | Return current user’s credit balance. |
| **GET** | `/api/job/:id` | Poll job status (queued | processing | completed | failed) and `videoUrl` when done. |

All authenticated endpoints assume a session or JWT; validate and load `userId` before DB access.

---

## 7. Background Worker

### Responsibilities

1. **Poll queue** for the next job (or receive via Inngest/Trigger.dev event).
2. **Load job** from DB; validate still in `queued` or `processing`.
3. **Call AI provider** with `prompt` (and options); get job id from provider.
4. **Monitor** provider job (poll status or wait for webhook).
5. **On success:** download or get URL → upload to S3/R2 → get final `videoUrl`.
6. **Update DB:** set `VideoJob.videoUrl`, `status = completed`.
7. **Deduct credits** (if not already reserved).
8. **On failure:** set `status = failed`; refund if credits were reserved.
9. **Retries:** configurable retries with backoff for transient errors; after max retries, mark failed and refund.

### Deployment

- Run workers as a separate process (e.g. `node workers/video-worker.js` or Inngest/Trigger.dev).
- Scale by running multiple worker instances; queue ensures each job is handled once.

---

## 8. Database Schema

### Core tables (conceptual)

**Users**

| Column   | Type     | Description        |
|----------|----------|--------------------|
| id       | uuid/pk  |                    |
| email    | string   | Unique             |
| credits  | int      | Current balance    |
| createdAt| datetime |                    |
| updatedAt| datetime |                    |

**VideoJobs**

| Column    | Type     | Description                    |
|-----------|----------|--------------------------------|
| id        | uuid/pk  |                                |
| userId    | fk       | → Users                        |
| prompt    | text     | User prompt                    |
| status    | enum     | queued, processing, completed, failed |
| videoUrl  | string?  | Final URL after completion     |
| providerJobId | string? | AI provider’s job id       |
| creditsUsed | int     | Credits deducted for this job  |
| createdAt | datetime |                                |
| updatedAt | datetime |                                |
| completedAt | datetime? | When status → completed     |

**Transactions** (credit ledger, optional but recommended)

| Column   | Type     | Description              |
|----------|----------|--------------------------|
| id       | uuid/pk  |                          |
| userId   | fk       | → Users                  |
| amount   | int      | + for add, - for deduct  |
| type     | enum     | signup, purchase, consumption, refund |
| videoJobId | uuid?  | If type = consumption    |
| createdAt| datetime |                          |

Use **Prisma** to define these and add indexes (e.g. `userId`, `status`, `createdAt` for listing and reporting).

---

## 9. Security Considerations

| Area | Measures |
|------|----------|
| **Rate limiting** | Per user and per IP on `/api/generate-video` and auth endpoints (e.g. 5–10/min). Use Upstash Redis or Vercel KV. |
| **Prompt moderation** | Before enqueueing, call OpenAI Moderation or similar; reject or flag unsafe prompts. |
| **API key protection** | Store AI provider API keys in env (e.g. Vercel/railway); never in client or repo. Worker only. |
| **Queue protection** | Queue only from server; validate auth and credits before pushing. Don’t expose queue to client. |
| **Webhook verification** | Validate provider webhook signature (HMAC or shared secret) before updating job or deducting credits. |
| **Auth** | Secure session or JWT; validate on every API route that touches user data or credits. |
| **CORS / API exposure** | Restrict API to your frontend origin if called from browser; use same-origin or strict CORS. |

---

## 10. Scaling Strategy

| Component | Approach |
|-----------|----------|
| **Workers** | Run N worker processes or containers; queue distributes jobs. |
| **Queue** | Use a managed Redis (Upstash, Redis Cloud) or managed job service (Inngest, Trigger.dev). |
| **Videos** | Serve via **CDN** (CloudFront, R2 public bucket + CDN); store only in S3/R2. |
| **Caching** | Cache user credits in Redis for a short TTL to reduce DB reads on hot paths. |
| **API** | Stateless API routes; scale horizontally (e.g. Vercel, multiple instances). |
| **DB** | Connection pooling (Prisma); read replicas for listing/history if needed. |

---

## 11. Cost Considerations

### What costs money

- **AI video APIs:** Per minute or per run (Runway, Pika, Replicate, etc.).
- **GPU/compute:** If using Replicate or self-hosted models.
- **Storage:** S3/R2 for video files (and backups).
- **Bandwidth:** Serving downloads; reduce by using CDN and optional compression.
- **Queue/Redis:** If using managed Redis or Inngest/Trigger.dev.

### Profitability

- **Pricing:** Set credit price so that (credit price × credits per video) > (API cost per video + storage/bandwidth).
- **Tiers:** Free tier (limited credits), then paid packs or subscriptions.
- **Caps:** Max video length or resolution per plan to control API cost.
- **Caching:** Reuse or “clone” videos for identical prompts if provider supports it (optional).

---

## 12. Future Features

- **Image → video:** Upload image + prompt; use img2vid APIs.
- **Templates:** Predefined scenes; user fills in variables (e.g. “Product X in scene Y”).
- **AI avatars:** Talking-head or avatar video from text/script.
- **Voiceover:** TTS for narration; mux with generated video.
- **In-app editing:** Trim, combine, or overlay text on generated clips.
- **Batch rendering:** Multiple prompts in one request; bulk export.
- **Public API:** API keys for developers; same credit system and webhooks for integrations.

---

## 13. Folder Structure (Next.js, backend-oriented)

```
my-app/
├── app/
│   ├── api/
│   │   ├── generate-video/
│   │   │   └── route.ts
│   │   ├── video/
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── user/
│   │   │   ├── videos/
│   │   │   │   └── route.ts
│   │   │   └── credits/
│   │   │       └── route.ts
│   │   ├── buy-credits/
│   │   │   └── route.ts
│   │   └── webhook/
│   │       └── video-ready/
│   │           └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── db.ts          # Prisma client singleton
│   ├── queue.ts       # Queue client (BullMQ/Inngest)
│   ├── storage.ts     # S3/R2 upload & signed URL
│   ├── auth.ts        # Session / JWT helpers
│   └── credits.ts     # Check, deduct, add credits
├── services/
│   ├── video-generation.ts   # Call AI provider, poll or webhook
│   └── moderation.ts        # Prompt moderation
├── workers/
│   └── video-worker.ts      # Queue consumer
├── db/
│   └── schema.prisma
├── utils/
│   ├── idempotency.ts
│   └── rate-limit.ts
├── package.json
├── .env.example
└── README.md
```

---

## 14. Development Steps (Roadmap)

| Step | Focus |
|------|--------|
| **1. Auth** | Add auth (NextAuth, Clerk, or custom JWT); protect API routes; get `userId` in handlers. |
| **2. Credits** | Prisma schema (Users.credits, Transactions); signup credits; `GET /api/user/credits`; helpers to check/deduct/add. |
| **3. AI video API** | Pick one provider (e.g. Replicate); implement `services/video-generation.ts` (submit job, poll or webhook); test with API key. |
| **4. Queue + worker** | Add Redis + BullMQ (or Inngest); `POST /api/generate-video` creates job and enqueues; worker runs in separate process, calls service, updates job and credits. |
| **5. Storage** | S3 or R2 bucket; worker uploads completed video; save `videoUrl` in VideoJobs; `GET /api/video/:id` returns URL or redirect. |
| **6. Billing** | Stripe (or similar); `POST /api/buy-credits` creates checkout; webhook adds credits and logs Transaction. |
| **7. Scaling** | Add rate limiting, caching for credits, CDN for video URLs; document env and runbook for multiple workers. |

---

## Next: Backend Implementation

The backend is implemented in this repo in the following order:

1. **Prisma schema** — `db/schema.prisma`: Users, VideoJobs, Transactions.
2. **Credit system** — `lib/credits.ts`: check, deduct, add, signup credits.
3. **Video generation API** — `app/api/generate-video/route.ts`: POST, queue, job creation.
4. **Queue worker** — `workers/video-worker.ts` + `workers/queue-redis.ts`: consume job, call AI, update job and credits.
5. **Storage integration** — `lib/storage.ts`: S3/R2 upload; worker uses it when `UPLOAD_VIDEO_TO_STORAGE=true`.

### Quick start (backend)

```bash
cp .env.example .env   # set DATABASE_URL, etc.
npm install
npx prisma generate
npx prisma db push     # or migrate dev
npm run dev            # API + in-memory queue
# With Redis: set REDIS_URL and run "npm run worker" in another terminal
```

No UI is in scope for this backend-focused doc; all flows are driven by API and worker.
