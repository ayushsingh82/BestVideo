import { prisma } from "@/lib/db";
import {
  CREDITS_PER_VIDEO,
  deductCredits,
  refundCredits,
} from "@/lib/credits";
import { generateVideo } from "@/services/video-generation";
import { uploadVideo, videoKey } from "@/lib/storage";
import type { VideoJobPayload } from "@/lib/queue";

/**
 * Process a single video job: call AI provider, upload to storage, update DB, deduct credits.
 */
export async function processVideoJob(payload: VideoJobPayload): Promise<void> {
  const { jobId, userId, prompt } = payload;

  try {
    await prisma.videoJob.update({
      where: { id: jobId },
      data: { status: "processing" },
    });
  } catch {
    console.error(`VideoJob ${jobId} not found`);
    return;
  }

  const result = await generateVideo({ prompt, provider: payload.provider });

  if (!result.success) {
    await prisma.videoJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errorMessage: result.error,
        providerJobId: result.providerJobId ?? undefined,
      },
    });
    return;
  }

  let finalUrl = result.videoUrl;

  // Optionally re-upload to our storage (e.g. for persistence if provider URL is temporary)
  const uploadToOwnStorage = process.env.UPLOAD_VIDEO_TO_STORAGE === "true";
  if (uploadToOwnStorage) {
    try {
      const res = await fetch(result.videoUrl);
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
      return;
    }
  }

  await prisma.videoJob.update({
    where: { id: jobId },
    data: {
      status: "completed",
      videoUrl: finalUrl,
      providerJobId: result.providerJobId ?? undefined,
      creditsUsed: CREDITS_PER_VIDEO,
      completedAt: new Date(),
    },
  });

  try {
    await deductCredits(userId, CREDITS_PER_VIDEO, jobId);
  } catch (e) {
    console.error("Deduct credits failed:", e);
    await refundCredits(userId, CREDITS_PER_VIDEO, jobId);
    await prisma.videoJob.update({
      where: { id: jobId },
      data: { status: "failed", errorMessage: "Credits deduction failed" },
    });
  }
}
