import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { hasEnoughCredits, CREDITS_PER_IMAGE } from "@/lib/credits";
import { enqueueImageJob, setImageJobHandler } from "@/lib/queue";
import { processImageJob } from "@/workers/image-worker";
import { moderatePrompt } from "@/services/moderation";

// Register in-memory queue handler once (for dev when Redis not used)
let handlerSet = false;
function ensureHandler() {
  if (!handlerSet) {
    setImageJobHandler(processImageJob);
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

  let body: { prompt?: string; aspect_ratio?: string; idempotencyKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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

  // Check if enough credits for ONE image
  const credits = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  
  const hasCredits = (credits?.credits ?? 0) >= CREDITS_PER_IMAGE;
  if (!hasCredits) {
    return NextResponse.json(
      { error: "Insufficient credits", code: "INSUFFICIENT_CREDITS" },
      { status: 402 }
    );
  }

  // Idempotency: optional idempotencyKey to avoid duplicate jobs
  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey : null;
  if (idempotencyKey) {
    const existing = await prisma.imageJob.findFirst({
      where: { userId, id: idempotencyKey },
    });
    if (existing) {
      return NextResponse.json(
        { jobId: existing.id, status: existing.status, message: "Duplicate request" },
        { status: 200 }
      );
    }
  }

  const aspect_ratio = ["1:1", "16:9", "9:16", "3:2", "2:3", "4:5"].includes(body.aspect_ratio || "") 
    ? body.aspect_ratio 
    : "1:1";

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

  return NextResponse.json(
    { jobId: job.id, status: job.status, creditsRequired: CREDITS_PER_IMAGE },
    { status: 202 }
  );
}
