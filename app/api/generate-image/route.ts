import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { hasEnoughCredits, CREDITS_PER_IMAGE } from "@/lib/credits";
import { enqueueImageJob, setImageJobHandler } from "@/lib/queue";
import { processImageJob } from "@/workers/image-worker";
import { moderatePrompt } from "@/services/moderation";
import { getIdempotencyKey, getIdempotent, setIdempotent } from "@/utils/idempotency";
import { rateLimit, getRequestIdentifier } from "@/utils/rate-limit";

// Register in-memory queue handler once (for dev when Redis not used)
let handlerSet = false;
function ensureHandler() {
  if (!handlerSet) {
    setImageJobHandler(processImageJob);
    handlerSet = true;
  }
}

const VALID_RATIOS = ["1:1", "16:9", "9:16", "3:2", "2:3", "4:5"];

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
    max: 10,
    scope: "generate-image",
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { prompt?: string; aspect_ratio?: string; idempotencyKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const idempotencyKey = getIdempotencyKey(request, body);
  if (idempotencyKey) {
    const cached = await getIdempotent<SuccessBody>(userId, `gen-image:${idempotencyKey}`);
    if (cached) {
      return NextResponse.json(cached, { status: 200 });
    }
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt || prompt.length > 2000) {
    return NextResponse.json(
      { error: "prompt is required and must be under 2000 characters" },
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

  const hasCredits = await hasEnoughCredits(userId, CREDITS_PER_IMAGE);
  if (!hasCredits) {
    return NextResponse.json(
      { error: "Insufficient credits", code: "INSUFFICIENT_CREDITS", creditsRequired: CREDITS_PER_IMAGE },
      { status: 402 }
    );
  }

  const aspect_ratio = VALID_RATIOS.includes(body.aspect_ratio || "") ? body.aspect_ratio! : "1:1";

  const job = await prisma.imageJob.create({
    data: {
      userId,
      prompt,
      aspectRatio: aspect_ratio,
      status: "queued",
      creditsUsed: 0,
    },
  });

  ensureHandler();
  await enqueueImageJob({
    jobId: job.id,
    userId,
    prompt,
    aspect_ratio,
  });

  const response: SuccessBody = {
    jobId: job.id,
    status: job.status,
    creditsRequired: CREDITS_PER_IMAGE,
  };

  if (idempotencyKey) {
    await setIdempotent(userId, `gen-image:${idempotencyKey}`, response);
  }

  return NextResponse.json(response, { status: 202 });
}
