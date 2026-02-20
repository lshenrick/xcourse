export interface ParsedVideoUrl {
  type: "gdrive" | "dropbox" | "direct" | "embed";
  src: string;
}

/**
 * Parse a video URL and determine the best way to embed it.
 * Supports Google Drive, Dropbox, direct video URLs, and fallback iframe embed.
 */
export function parseVideoUrl(url: string): ParsedVideoUrl {
  if (!url || !url.trim()) {
    return { type: "embed", src: "" };
  }

  const trimmed = url.trim();

  // Google Drive: extract file ID and create preview URL
  // Formats:
  //   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  //   https://drive.google.com/file/d/FILE_ID/preview
  //   https://drive.google.com/open?id=FILE_ID
  const gdriveMatch = trimmed.match(
    /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/
  );
  if (gdriveMatch) {
    const fileId = gdriveMatch[1];
    return {
      type: "gdrive",
      src: `https://drive.google.com/file/d/${fileId}/preview`,
    };
  }

  // Dropbox: convert sharing link to direct download
  // https://www.dropbox.com/s/xxx/file.mp4?dl=0 → ?dl=1
  if (trimmed.includes("dropbox.com/")) {
    const directUrl = trimmed.replace(/[?&]dl=0/, "?dl=1");
    return {
      type: "dropbox",
      src: directUrl.includes("dl=1") ? directUrl : directUrl + "?dl=1",
    };
  }

  // Direct video URL (by extension)
  const videoExtensions = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;
  if (videoExtensions.test(trimmed)) {
    return { type: "direct", src: trimmed };
  }

  // Fallback: treat as generic embed URL (iframe)
  return { type: "embed", src: trimmed };
}

/**
 * Upload a file to Cloudflare R2 using presigned URLs.
 *
 * Flow:
 * 1. Call /api/upload with file metadata (small JSON) → get presigned URL
 * 2. Upload file directly from browser to R2 using presigned URL (bypasses Vercel 4.5MB limit)
 *
 * Returns the public URL of the uploaded file.
 */
export async function uploadToR2(
  file: File,
  folder: string = "uploads"
): Promise<{ url: string; key: string; fileName: string }> {
  // Step 1: Get presigned URL from our API (small JSON request)
  let presignResponse: Response;

  try {
    presignResponse = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: encodeURIComponent(file.name),
        fileType: file.type || "application/octet-stream",
        folder: folder,
      }),
    });
  } catch (fetchErr) {
    console.error("Presign fetch error:", fetchErr);
    throw new Error("Erro de conexão. Verifique sua internet.");
  }

  if (!presignResponse.ok) {
    let errMsg = `Erro ao preparar upload (HTTP ${presignResponse.status})`;
    try {
      const errBody = await presignResponse.text();
      console.error("Presign error:", presignResponse.status, errBody);
      const errJson = JSON.parse(errBody);
      errMsg = errJson.error || errJson.message || errMsg;
      if (errJson.missing) {
        errMsg += ` — Variáveis faltando: ${errJson.missing.join(", ")}`;
      }
    } catch {
      // couldn't parse
    }
    throw new Error(errMsg);
  }

  const { presignedUrl, publicUrl, fileName } = await presignResponse.json();

  // Step 2: Upload file directly to R2 using presigned URL (no size limit!)
  let uploadResponse: Response;

  try {
    uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });
  } catch (uploadErr) {
    console.error("R2 upload error:", uploadErr);
    throw new Error("Erro ao enviar arquivo para o storage. Verifique sua internet.");
  }

  if (!uploadResponse.ok) {
    const errText = await uploadResponse.text().catch(() => "");
    console.error("R2 upload failed:", uploadResponse.status, errText);
    throw new Error(`Upload para R2 falhou (HTTP ${uploadResponse.status})`);
  }

  return { url: publicUrl, key: fileName, fileName };
}
