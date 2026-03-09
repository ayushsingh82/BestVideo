import { prisma } from "@/lib/db";
import {
  CREDITS_PER_IMAGE,
  deductCredits,
  refundCredits,
} from "@/lib/credits";
import { generateImage } from "@/services/image-generation";
import { uploadVideo } from "@/lib/storage";
import { ImageJobPayload } from "@/lib/queue";

/**
 * Process a single image job: call AI provider, upload to storage, update DB, deduct credits.
 */
export async function processImageJob(payload: ImageJobPayload): Promise<void> {
  const { jobId, userId, prompt } = payload;

  try {
    await prisma.imageJob.update({
      where: { id: jobId },
      data: { status: "processing" },
    });
  } catch {
    console.error(`ImageJob ${jobId} not found`);
    return;
  }

  const result = await generateImage({ prompt, provider: payload.provider });

  if (!result.success) {
    await prisma.imageJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errorMessage: result.error,
        providerJobId: result.providerJobId ?? undefined,
      },
    });
    return;
  }

  let finalUrl = result.imageUrl;

  // Optionally re-upload to our storage (e.g. for persistence if provider URL is temporary)
  const uploadToOwnStorage = process.env.UPLOAD_IMAGE_TO_STORAGE === "true";
  if (uploadToOwnStorage) {
    try {
      const res = await fetch(result.imageUrl);
      const buffer = Buffer.from(await res.arrayBuffer());
      // We can reuse videoKey logic but with a different extension or just create an imageKey function
      // For now we'll just format it
      const date = new Date().toISOString().slice(0, 10);
      const key = `images/${date}/${jobId}.webp`;
      const { url } = await uploadVideo(key, buffer, "image/webp");
      finalUrl = url;
    } catch (e) {
      console.error("Upload to storage failed:", e);
      await prisma.imageJob.update({
        where: { id: jobId },
        data: { status: "failed", errorMessage: "Storage upload failed" },
      });
      return;
    }
  }

  await prisma.imageJob.update({
    where: { id: jobId },
    data: {
      status: "completed",
      imageUrl: finalUrl,
      providerJobId: result.providerJobId ?? undefined,
      creditsUsed: CREDITS_PER_IMAGE,
      completedAt: new Date(),
    },
  });

  try {
    await deductCredits(userId, CREDITS_PER_IMAGE, jobId, "image");
  } catch (e) {
    console.error("Deduct credits failed:", e);
    await refundCredits(userId, CREDITS_PER_IMAGE, jobId, "image");
    await prisma.imageJob.update({
      where: { id: jobId },
      data: { status: "failed", errorMessage: "Credits deduction failed" },
    });
  }
}
