/**
 * Redis-backed queue (BullMQ). Used when REDIS_URL is set.
 * Run worker: npx tsx workers/run-worker.ts (or node with ts-node)
 */

import { Queue, Worker } from "bullmq";
import { processVideoJob } from "@/workers/video-worker";
import type { VideoJobPayload } from "@/lib/queue";

const connection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
  password: process.env.REDIS_PASSWORD,
};

const QUEUE_NAME = "video-generation";

export function getVideoQueue() {
  return new Queue<VideoJobPayload>(QUEUE_NAME, {
    connection: process.env.REDIS_URL ? { url: process.env.REDIS_URL } : connection,
    defaultJobOptions: { removeOnComplete: 100, attempts: 3, backoff: { type: "exponential", delay: 5000 } },
  });
}

export async function addVideoJob(payload: VideoJobPayload): Promise<void> {
  const queue = getVideoQueue();
  await queue.add("generate", payload, { jobId: payload.jobId });
}

export function runWorker(): Worker<VideoJobPayload, void> {
  const worker = new Worker<VideoJobPayload, void>(
    QUEUE_NAME,
    async (job) => {
      await processVideoJob(job.data);
    },
    {
      connection: process.env.REDIS_URL ? { url: process.env.REDIS_URL } : connection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY ?? "2", 10),
    }
  );
  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });
  return worker;
}
