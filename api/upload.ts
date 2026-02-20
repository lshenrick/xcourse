import type { IncomingMessage, ServerResponse } from "http";

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
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ""; // e.g. https://files.xmembers.app

// Simple HMAC-SHA256 signing for S3 API (AWS Signature V4)
async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const crypto = await import("crypto");
  const hmac = crypto.createHmac("sha256", key);
  hmac.update(message);
  return new Uint8Array(hmac.digest());
}

async function sha256(data: Buffer | string): Promise<string> {
  const crypto = await import("crypto");
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function getSignatureKey(key: string, dateStamp: string, region: string, service: string) {
  let kDate = await hmacSha256(new TextEncoder().encode("AWS4" + key), dateStamp);
  let kRegion = await hmacSha256(kDate, region);
  let kService = await hmacSha256(kRegion, service);
  let kSigning = await hmacSha256(kService, "aws4_request");
  return kSigning;
}

function collectBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
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
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL) {
    return res.status(500).json({ error: "R2 not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL in Vercel env." });
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

    // S3 API endpoint for Cloudflare R2
    const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const url = `${endpoint}/${R2_BUCKET_NAME}/${objectKey}`;

    // AWS Signature V4
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const dateOnly = dateStamp.substring(0, 8);
    const region = "auto";
    const service = "s3";
    const payloadHash = await sha256(body);

    const canonicalHeaders =
      `content-type:${fileType}\n` +
      `host:${R2_ACCOUNT_ID}.r2.cloudflarestorage.com\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${dateStamp}\n`;
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest = [
      "PUT",
      `/${R2_BUCKET_NAME}/${objectKey}`,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateOnly}/${region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      dateStamp,
      credentialScope,
      await sha256(canonicalRequest),
    ].join("\n");

    const signingKey = await getSignatureKey(R2_SECRET_ACCESS_KEY, dateOnly, region, service);
    const crypto = await import("crypto");
    const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

    const authorization = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Upload to R2
    const uploadRes = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": fileType,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": dateStamp,
        Authorization: authorization,
      },
      body: body,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("R2 upload error:", errText);
      return res.status(500).json({ error: "Upload to R2 failed", details: errText });
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
    return res.status(500).json({ error: "Upload failed", message });
  }
}
