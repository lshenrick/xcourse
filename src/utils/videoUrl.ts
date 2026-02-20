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
 * Upload a file to Cloudflare R2 via the /api/upload endpoint.
 * Returns the public URL of the uploaded file.
 */
export async function uploadToR2(
  file: File,
  folder: string = "uploads"
): Promise<{ url: string; key: string; fileName: string }> {
  let response: Response;

  try {
    response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "x-file-name": encodeURIComponent(file.name),
        "x-file-type": file.type || "application/octet-stream",
        "x-folder": folder,
      },
      body: file,
    });
  } catch (fetchErr) {
    console.error("Upload fetch error:", fetchErr);
    throw new Error("Erro de conexão ao enviar arquivo. Verifique sua internet.");
  }

  if (!response.ok) {
    let errMsg = `Upload falhou (HTTP ${response.status})`;
    try {
      const errBody = await response.text();
      console.error("Upload error response:", response.status, errBody);
      const errJson = JSON.parse(errBody);
      errMsg = errJson.error || errJson.message || errMsg;
      if (errJson.missing) {
        errMsg += ` — Variáveis faltando: ${errJson.missing.join(", ")}`;
      }
      if (errJson.details) {
        errMsg += ` — ${errJson.details.substring(0, 200)}`;
      }
    } catch {
      // couldn't parse JSON, use status text
    }
    throw new Error(errMsg);
  }

  return response.json();
}
