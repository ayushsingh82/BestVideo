import { prisma } from "@/lib/db";
import { Prisma, PrismaClient } from "@prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/** Credits required per video generation. */
export const CREDITS_PER_VIDEO = 10;

/** Credits required per image generation. */
export const CREDITS_PER_IMAGE = 5;

/** Free credits given on signup. */
export const SIGNUP_CREDITS = 50;

/**
 * Get current credit balance for a user.
 */
export async function getCredits(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return user?.credits ?? 0;
}

/**
 * Check if user has at least `amount` credits. Defaults to CREDITS_PER_VIDEO
 * for backward compatibility with existing video callers.
 */
export async function hasEnoughCredits(
  userId: string,
  amount: number = CREDITS_PER_VIDEO
): Promise<boolean> {
  const credits = await getCredits(userId);
  return credits >= amount;
}

/**
 * Deduct credits and record a consumption transaction.
 * Call only after video/image generation succeeds.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  jobId: string,
  jobType: "video" | "image" = "video"
): Promise<void> {
  await prisma.$transaction(async (tx: TxClient) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { credits: true },
    });
    if (user.credits < amount) {
      throw new Error("Insufficient credits");
    }
    await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
    });
    await tx.transaction.create({
      data: {
        userId,
        amount: -amount,
        type: "consumption",
        videoJobId: jobType === "video" ? jobId : undefined,
        imageJobId: jobType === "image" ? jobId : undefined,
      },
    });
  });
}

/**
 * Add credits (e.g. purchase or refund) and record transaction.
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: "signup" | "purchase" | "consumption" | "refund",
  jobId?: string,
  jobType?: "video" | "image"
): Promise<void> {
  await prisma.$transaction(async (tx: TxClient) => {
    await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    });
    await tx.transaction.create({
      data: {
        userId,
        amount,
        type,
        videoJobId: jobType === "video" ? jobId : undefined,
        imageJobId: jobType === "image" ? jobId : undefined,
      },
    });
  });
}

/**
 * Grant signup credits. Call when creating a new user.
 */
export async function grantSignupCredits(userId: string): Promise<void> {
  await addCredits(userId, SIGNUP_CREDITS, "signup");
}

/**
 * Refund credits when a job fails after reservation (if you use reservation flow).
 */
export async function refundCredits(
  userId: string,
  amount: number,
  jobId: string,
  jobType: "video" | "image" = "video"
): Promise<void> {
  await addCredits(userId, amount, "refund", jobId, jobType);
}
