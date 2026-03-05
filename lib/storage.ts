/**
 * Video storage — S3 / Cloudflare R2.
 * Uses AWS SDK (R2 is S3-compatible).
 *
 * Env: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, S3_REGION
 * For R2: S3_ENDPOINT = https://<account>.r2.cloudflarestorage.com
 */

const bucket = process.env.S3_BUCKET ?? "";
const region = process.env.S3_REGION ?? "auto";
const endpoint = process.env.S3_ENDPOINT; // set for R2
const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL ?? ""; // e.g. CDN URL

export interface UploadResult {
  key: string;
  url: string;
}

/**
 * Upload a buffer to S3/R2 and return the object key and public URL.
 */
export async function uploadVideo(
  key: string,
  body: Buffer | Uint8Array,
  contentType = "video/mp4"
): Promise<UploadResult> {
  if (!bucket) {
    throw new Error("S3_BUCKET is not set");
  }

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region,
    ...(endpoint && { endpoint }),
    ...(process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY && {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }),
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const url = publicBaseUrl
    ? `${publicBaseUrl.replace(/\/$/, "")}/${key}`
    : endpoint
      ? `https://${bucket}.${endpoint.replace(/^https?:\/\//, "").split("/")[0]}/${key}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return { key, url };
}

/**
 * Generate a unique storage key for a video job.
 */
export function videoKey(jobId: string, extension = "mp4"): string {
  const date = new Date().toISOString().slice(0, 10);
  return `videos/${date}/${jobId}.${extension}`;
}

/**
 * Get a signed URL for private bucket (optional).
 */
export async function getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region,
    ...(endpoint && { endpoint }),
    ...(process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY && {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }),
  });
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}
