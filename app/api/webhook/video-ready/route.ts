import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deductCredits, CREDITS_PER_VIDEO, refundCredits } from "@/lib/credits";
import { uploadVideo, videoKey } from "@/lib/storage";

/**
 * Webhook called by AI provider when video is ready (e.g. Runway, Replicate).
 * Verify signature using provider secret before trusting the payload.
 *
 * Env: VIDEO_WEBHOOK_SECRET for HMAC verification.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.VIDEO_WEBHOOK_SECRET;
  if (secret) {
    const signature = request.headers.get("x-webhook-signature") ?? request.headers.get("x-signature");
    const expected = await hmacSha256(secret, raw);
    if (!signature || !timingSafeEqual(signature, expected)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let body: { jobId?: string; videoUrl?: string; status?: string; errorMessage?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const jobId = body.jobId;
  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  const job = await prisma.videoJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (job.status === "completed") {
    return NextResponse.json({ message: "Already completed" }, { status: 200 });
  }

  const videoUrl = body.videoUrl;
  const status = body.status;

  if (status === "failed" || !videoUrl) {
    await prisma.videoJob.update({
      where: { id: jobId },
      data: { status: "failed", errorMessage: body.errorMessage ?? "Provider failed" },
    });
    return NextResponse.json({ ok: true });
  }

  let finalUrl = videoUrl;
  if (process.env.UPLOAD_VIDEO_TO_STORAGE === "true") {
    try {
      const res = await fetch(videoUrl);
      const buffer = Buffer.from(await res.arrayBuffer());
      const key = videoKey(jobId);
      const { url } = await uploadVideo(key, buffer);
      finalUrl = url;
    } catch (e) {
      console.error("Upload to storage failed:", e);
      await prisma.videoJob.update({
        where: { id: jobId },
        data: { status: "failed", errorMessage: "Storage upload failed" },
      });
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  }

  await prisma.videoJob.update({
    where: { id: jobId },
    data: {
      status: "completed",
      videoUrl: finalUrl,
      creditsUsed: CREDITS_PER_VIDEO,
      completedAt: new Date(),
    },
  });

  try {
    await deductCredits(job.userId, CREDITS_PER_VIDEO, jobId);
  } catch (e) {
    console.error("Deduct credits failed:", e);
    await refundCredits(job.userId, CREDITS_PER_VIDEO, jobId);
    await prisma.videoJob.update({
      where: { id: jobId },
      data: { status: "failed", errorMessage: "Credits deduction failed" },
    });
  }

  return NextResponse.json({ ok: true });
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
