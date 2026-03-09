/**
 * Job queue for video generation.
 * Default: in-process queue (for dev). Replace with BullMQ/Redis in production.
 *
 * Env: REDIS_URL — when set, use BullMQ; otherwise use in-memory queue.
 */

export interface VideoJobPayload {
  jobId: string;
  userId: string;
  prompt: string;
  provider?: string;
}

export interface ImageJobPayload {
  jobId: string;
  userId: string;
  prompt: string;
  aspect_ratio?: string;
  provider?: string;
}

let queueHandler: ((payload: VideoJobPayload) => Promise<void>) | null = null;
let imageQueueHandler: ((payload: ImageJobPayload) => Promise<void>) | null = null;

/** In-memory queue for development when Redis is not available. */
const memoryQueue: VideoJobPayload[] = [];
let processing = false;

const memoryImageQueue: ImageJobPayload[] = [];
let processingImage = false;

async function processMemoryQueue() {
  if (processing || memoryQueue.length === 0) return;
  processing = true;
  const payload = memoryQueue.shift();
  if (payload && queueHandler) {
    try {
      await queueHandler(payload);
    } catch (e) {
      console.error("Queue worker error:", e);
    }
  }
  processing = false;
  if (memoryQueue.length > 0) setImmediate(processMemoryQueue);
}

async function processImageMemoryQueue() {
  if (processingImage || memoryImageQueue.length === 0) return;
  processingImage = true;
  const payload = memoryImageQueue.shift();
  if (payload && imageQueueHandler) {
    try {
      await imageQueueHandler(payload);
    } catch (e) {
      console.error("Image queue worker error:", e);
    }
  }
  processingImage = false;
  if (memoryImageQueue.length > 0) setImmediate(processImageMemoryQueue);
}

/**
 * Add a video generation job to the queue.
 */
export async function enqueueVideoJob(payload: VideoJobPayload): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const { addVideoJob } = await import("@/workers/queue-redis");
    await addVideoJob(payload);
    return;
  }
  memoryQueue.push(payload);
  setImmediate(processMemoryQueue);
}

/**
 * Add an image generation job to the queue.
 */
export async function enqueueImageJob(payload: ImageJobPayload): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const { addImageJob } = await import("@/workers/queue-redis");
    await addImageJob(payload);
    return;
  }
  memoryImageQueue.push(payload);
  setImmediate(processImageMemoryQueue);
}

/**
 * Register the worker handler (called by video worker).
 */
export function setVideoJobHandler(handler: (payload: VideoJobPayload) => Promise<void>) {
  queueHandler = handler;
}

/**
 * Register the image worker handler.
 */
export function setImageJobHandler(handler: (payload: ImageJobPayload) => Promise<void>) {
  imageQueueHandler = handler;
}
