import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { hasEnoughCredits, CREDITS_PER_VIDEO } from "@/lib/credits";
import { enqueueVideoJob, setVideoJobHandler } from "@/lib/queue";
import { processVideoJob } from "@/workers/video-worker";
import { moderatePrompt } from "@/services/moderation";

// Register in-memory queue handler once (for dev when Redis not used)
let handlerSet = false;
function ensureHandler() {
  if (!handlerSet) {
    setVideoJobHandler(processVideoJob);
    handlerSet = true;
  }
}

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = requireUserId(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { prompt?: string; idempotencyKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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
      { error: "Insufficient credits", code: "INSUFFICIENT_CREDITS" },
      { status: 402 }
    );
  }

  // Idempotency: optional idempotencyKey to avoid duplicate jobs
  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey : null;
  if (idempotencyKey) {
    const existing = await prisma.videoJob.findFirst({
      where: { userId, id: idempotencyKey },
    });
    if (existing) {
      return NextResponse.json(
        { jobId: existing.id, status: existing.status, message: "Duplicate request" },
        { status: 200 }
      );
    }
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

  return NextResponse.json(
    { jobId: job.id, status: job.status, creditsRequired: CREDITS_PER_VIDEO },
    { status: 202 }
  );
}
