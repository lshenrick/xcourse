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

// IMPORTANT: Disable Vercel's automatic body parsing so we get raw binary
export const config = {
  api: {
    bodyParser: false,
  },
};

// Cloudflare R2 S3-compatible API
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "xmembers-files";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

function hmacSha256(key: Buffer | Uint8Array, message: string): Buffer {
  return crypto.createHmac("sha256", key).update(message).digest();
}

function sha256hex(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmacSha256(Buffer.from("AWS4" + key), dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "aws4_request");
  return kSigning;
}

function collectBody(req: IncomingMessage, maxSize: number = 500 * 1024 * 1024): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;
    req.on("data", (chunk: Buffer) => {
      totalSize += chunk.length;
      if (totalSize > maxSize) {
        reject(new Error(`File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-file-name, x-file-type, x-folder");

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
      message: `Missing env vars: ${missingVars.join(", ")}. Add them in Vercel Settings → Environment Variables.`,
    });
  }

  try {
    const fileName = (req.headers["x-file-name"] as string) || "file";
    const fileType = (req.headers["x-file-type"] as string) || "application/octet-stream";
    const folder = (req.headers["x-folder"] as string) || "uploads";

    // Generate unique path
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `${folder}/${timestamp}-${safeName}`;

    // Read the raw body
    const body = await collectBody(req);

    if (body.length === 0) {
      return res.status(400).json({ error: "Empty file body" });
    }

    // S3 API endpoint for Cloudflare R2
    const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const url = `https://${host}/${R2_BUCKET_NAME}/${objectKey}`;

    // AWS Signature V4
    const now = new Date();
    const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const dateOnly = amzDate.substring(0, 8);
    const region = "auto";
    const service = "s3";
    const payloadHash = sha256hex(body);

    // Canonical headers must be sorted alphabetically by key
    const canonicalHeaders =
      `content-type:${fileType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

    // URI encode the path segments
    const encodedKey = objectKey
      .split("/")
      .map((s) => encodeURIComponent(s))
      .join("/");

    const canonicalRequest = [
      "PUT",
      `/${R2_BUCKET_NAME}/${encodedKey}`,
      "", // empty query string
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateOnly}/${region}/${service}/aws4_request`;
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

    const authorization = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Upload to R2
    const uploadRes = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": fileType,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
        Authorization: authorization,
      },
      body: body,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("R2 upload error:", uploadRes.status, errText);
      return res.status(500).json({
        error: "Upload to R2 failed",
        status: uploadRes.status,
        details: errText,
      });
    }

    // Return public URL
    const publicUrl = `${R2_PUBLIC_URL}/${objectKey}`;

    return res.status(200).json({
      success: true,
      url: publicUrl,
      key: objectKey,
      fileName: safeName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Upload error:", message);
    return res.status(500).json({ error: message });
  }
}
