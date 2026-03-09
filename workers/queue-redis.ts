/**
 * Redis-backed queue (BullMQ). Used when REDIS_URL is set.
 * Run worker: npx tsx workers/run-worker.ts (or node with ts-node)
 */

import { Queue, Worker } from "bullmq";
import { processVideoJob } from "@/workers/video-worker";
import { processImageJob } from "@/workers/image-worker";
import type { VideoJobPayload, ImageJobPayload } from "@/lib/queue";

const connection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
  password: process.env.REDIS_PASSWORD,
};

const QUEUE_NAME = "video-generation";
const IMAGE_QUEUE_NAME = "image-generation";

export function getVideoQueue() {
  return new Queue<VideoJobPayload>(QUEUE_NAME, {
    connection: process.env.REDIS_URL ? { url: process.env.REDIS_URL } : connection,
    defaultJobOptions: { removeOnComplete: 100, attempts: 3, backoff: { type: "exponential", delay: 5000 } },
  });
}

export function getImageQueue() {
  return new Queue<ImageJobPayload>(IMAGE_QUEUE_NAME, {
    connection: process.env.REDIS_URL ? { url: process.env.REDIS_URL } : connection,
    defaultJobOptions: { removeOnComplete: 100, attempts: 3, backoff: { type: "exponential", delay: 5000 } },
  });
}

export async function addVideoJob(payload: VideoJobPayload): Promise<void> {
  const queue = getVideoQueue();
  await queue.add("generate", payload, { jobId: payload.jobId });
}

export async function addImageJob(payload: ImageJobPayload): Promise<void> {
  const queue = getImageQueue();
  await queue.add("generate-image", payload, { jobId: payload.jobId });
}

export function runWorker(): { videoWorker: Worker; imageWorker: Worker } {
  const videoWorker = new Worker<VideoJobPayload, void>(
    QUEUE_NAME,
    async (job) => {
      await processVideoJob(job.data);
    },
    {
      connection: process.env.REDIS_URL ? { url: process.env.REDIS_URL } : connection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY ?? "2", 10),
    }
  );
  videoWorker.on("failed", (job, err) => {
    console.error(`Video Job ${job?.id} failed:`, err);
  });

  const imageWorker = new Worker<ImageJobPayload, void>(
    IMAGE_QUEUE_NAME,
    async (job) => {
      await processImageJob(job.data);
    },
    {
      connection: process.env.REDIS_URL ? { url: process.env.REDIS_URL } : connection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY ?? "2", 10),
    }
  );
  imageWorker.on("failed", (job, err) => {
    console.error(`Image Job ${job?.id} failed:`, err);
  });

  return { videoWorker, imageWorker };
}
