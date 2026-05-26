import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = env.R2_BUCKET_NAME;

/**
 * Upload a file buffer to Cloudflare R2
 * @returns The storage key used to retrieve the file
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  console.log(`☁️ Uploading to R2: ${key} (${buffer.length} bytes, ${contentType})`);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  console.log(`☁️ Upload successful: ${key}`);
  return key;
}

/**
 * Download a file from R2 as a Buffer
 */
export async function downloadFromR2(key: string): Promise<Buffer> {
  console.log(`☁️ Downloading from R2: ${key}`);

  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );

  if (!response.Body) {
    throw new Error(`File not found in R2: ${key}`);
  }

  // Convert ReadableStream to Buffer
  const chunks: Uint8Array[] = [];
  const stream = response.Body as AsyncIterable<Uint8Array>;
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  console.log(`☁️ Downloaded ${buffer.length} bytes from R2`);
  return buffer;
}

/**
 * Generate a presigned URL for downloading a file (valid for 1 hour)
 */
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  console.log(`☁️ Deleting from R2: ${key}`);

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );

  console.log(`☁️ Deleted: ${key}`);
}

/**
 * Generate a storage key for uploaded files
 */
export function generateFileKey(filename: string): string {
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `uploads/${timestamp}-${sanitized}`;
}

/**
 * Generate a storage key for generated PDFs
 */
export function generatePdfKey(assignmentId: string): string {
  return `pdfs/${assignmentId}-${Date.now()}.pdf`;
}
