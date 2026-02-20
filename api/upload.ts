import type { IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";

interface VercelRequest extends IncomingMessage {
  body: any;
  query: Record<string, string | string[]>;
  cookies: Record<string, string>;
}
interface VercelResponse extends ServerResponse {
  status(code: number): VercelResponse;
  json(data: any): VercelResponse;
  send(data: any): VercelResponse;
}

// Cloudflare R2 S3-compatible API
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "xmembers-files";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

/**
 * This endpoint generates a presigned URL for direct browser-to-R2 upload.
 * The file never passes through Vercel — it goes straight from the browser to Cloudflare R2.
 * This avoids Vercel's 4.5MB body limit.
 *
 * Flow:
 * 1. Browser calls POST /api/upload with file metadata (name, type, folder) as JSON
 * 2. Server generates a presigned PUT URL valid for 10 minutes
 * 3. Browser uploads the file directly to R2 using the presigned URL
 */

function hmacSha256(key: Buffer, message: string): Buffer {
  return crypto.createHmac("sha256", key).update(message).digest();
}

function sha256hex(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmacSha256(Buffer.from("AWS4" + key), dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "aws4_request");
  return kSigning;
}

function generatePresignedUrl(
  method: string,
  objectKey: string,
  contentType: string,
  expiresIn: number = 600 // 10 minutes
): string {
  const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const region = "auto";
  const service = "s3";

  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dateOnly = amzDate.substring(0, 8);

  const credentialScope = `${dateOnly}/${region}/${service}/aws4_request`;
  const credential = `${R2_ACCESS_KEY_ID}/${credentialScope}`;

  // URI encode path segments
  const encodedKey = objectKey
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");

  // Query parameters for presigned URL (must be sorted alphabetically)
  const queryParams = new URLSearchParams();
  queryParams.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
  queryParams.set("X-Amz-Credential", credential);
  queryParams.set("X-Amz-Date", amzDate);
  queryParams.set("X-Amz-Expires", expiresIn.toString());
  queryParams.set("X-Amz-SignedHeaders", "content-type;host");

  // Sort query params alphabetically for canonical request
  const sortedParams = Array.from(queryParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
  const signedHeaders = "content-type;host";

  const canonicalRequest = [
    method,
    `/${R2_BUCKET_NAME}/${encodedKey}`,
    sortedParams,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256hex(canonicalRequest),
  ].join("\n");

  const signingKey = getSignatureKey(R2_SECRET_ACCESS_KEY, dateOnly, region, service);
  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  return `https://${host}/${R2_BUCKET_NAME}/${encodedKey}?${sortedParams}&X-Amz-Signature=${signature}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Validate R2 credentials
  const missingVars: string[] = [];
  if (!R2_ACCOUNT_ID) missingVars.push("R2_ACCOUNT_ID");
  if (!R2_ACCESS_KEY_ID) missingVars.push("R2_ACCESS_KEY_ID");
  if (!R2_SECRET_ACCESS_KEY) missingVars.push("R2_SECRET_ACCESS_KEY");
  if (!R2_PUBLIC_URL) missingVars.push("R2_PUBLIC_URL");

  if (missingVars.length > 0) {
    return res.status(500).json({
      error: "R2 not configured",
      missing: missingVars,
      message: `Missing env vars: ${missingVars.join(", ")}`,
    });
  }

  try {
    // Parse JSON body with file metadata
    const { fileName, fileType, folder } = req.body || {};

    if (!fileName) {
      return res.status(400).json({ error: "Missing fileName in request body" });
    }

    const contentType = fileType || "application/octet-stream";
    const targetFolder = folder || "uploads";

    // Generate unique path
    const timestamp = Date.now();
    const safeName = decodeURIComponent(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `${targetFolder}/${timestamp}-${safeName}`;

    // Generate presigned URL
    const presignedUrl = generatePresignedUrl("PUT", objectKey, contentType);

    // Public URL for accessing the file after upload
    const publicUrl = `${R2_PUBLIC_URL}/${objectKey}`;

    return res.status(200).json({
      presignedUrl,
      publicUrl,
      objectKey,
      fileName: safeName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Presign error:", message);
    return res.status(500).json({ error: message });
  }
}
