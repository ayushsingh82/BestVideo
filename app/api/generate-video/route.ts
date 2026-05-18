import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { hasEnoughCredits, CREDITS_PER_VIDEO } from "@/lib/credits";
import { enqueueVideoJob, setVideoJobHandler } from "@/lib/queue";
import { processVideoJob } from "@/workers/video-worker";
import { moderatePrompt } from "@/services/moderation";
import { getIdempotencyKey, getIdempotent, setIdempotent } from "@/utils/idempotency";
import { rateLimit, getRequestIdentifier } from "@/utils/rate-limit";

// Register in-memory queue handler once (for dev when Redis not used)
let handlerSet = false;
function ensureHandler() {
  if (!handlerSet) {
    setVideoJobHandler(processVideoJob);
    handlerSet = true;
  }
}

interface SuccessBody {
  jobId: string;
  status: string;
  creditsRequired: number;
}

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = requireUserId(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(getRequestIdentifier(request, userId), {
    windowSeconds: 60,
    max: 5,
    scope: "generate-video",
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { prompt?: string; idempotencyKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const idempotencyKey = getIdempotencyKey(request, body);
  if (idempotencyKey) {
    const cached = await getIdempotent<SuccessBody>(userId, `gen-video:${idempotencyKey}`);
    if (cached) {
      return NextResponse.json(cached, { status: 200 });
    }
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt || prompt.length > 10000) {
    return NextResponse.json(
      { error: "prompt is required and must be under 10000 characters" },
      { status: 400 }
    );
  }

  const moderation = await moderatePrompt(prompt);
  if (!moderation.allowed) {
    return NextResponse.json(
      { error: moderation.reason ?? "Prompt not allowed" },
      { status: 400 }
    );
  }

  const hasCredits = await hasEnoughCredits(userId);
  if (!hasCredits) {
    return NextResponse.json(
      { error: "Insufficient credits", code: "INSUFFICIENT_CREDITS", creditsRequired: CREDITS_PER_VIDEO },
      { status: 402 }
    );
  }

  const job = await prisma.videoJob.create({
    data: {
      userId,
      prompt,
      status: "queued",
      creditsUsed: 0,
    },
  });

  ensureHandler();
  await enqueueVideoJob({
    jobId: job.id,
    userId,
    prompt,
  });

  const response: SuccessBody = {
    jobId: job.id,
    status: job.status,
    creditsRequired: CREDITS_PER_VIDEO,
  };

  if (idempotencyKey) {
    await setIdempotent(userId, `gen-video:${idempotencyKey}`, response);
  }

  return NextResponse.json(response, { status: 202 });
}
