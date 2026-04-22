import type { VercelRequest, VercelResponse } from "@vercel/node";

// Same tokens as the install endpoint — rotate together.
// "public" is a stable alias surfaced from the onboarding overlay (DIG-84)
// so copy doesn't rot when the rotating token is cycled.
const VALID_TOKENS = new Set([
  "9b3998ea32f54ec9",
  "public",
]);

// The blob pathname in Vercel Blob storage.
// Updated by upload-blob.mjs when a new version is published.
const BLOB_PATHNAME = process.env.THROUGHLINE_BLOB_PATHNAME || "throughline/throughline-v0.2.0.tar.gz";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token } = req.query;

  if (typeof token !== "string" || !VALID_TOKENS.has(token)) {
    res.status(404).send("Not found");
    return;
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    res.status(500).send("Storage not configured");
    return;
  }

  // Fetch the blob from Vercel Blob storage using the REST API
  // The blob URL format: https://<store-id>.public.blob.vercel-storage.com/<pathname>
  // For private blobs, we need to use the API with auth
  try {
    const listRes = await fetch(
      `https://blob.vercel-storage.com?prefix=${encodeURIComponent(BLOB_PATHNAME)}&limit=1`,
      {
        headers: { authorization: `Bearer ${blobToken}` },
      }
    );

    if (!listRes.ok) {
      res.status(502).send("Storage error");
      return;
    }

    const { blobs } = await listRes.json() as { blobs: Array<{ url: string; downloadUrl: string }> };
    if (!blobs || blobs.length === 0) {
      res.status(404).send("Release not found — publish with: ./scripts/pack-tarball.sh && node scripts/upload-blob.mjs");
      return;
    }

    // For private blobs, use the downloadUrl which includes a signed token
    const downloadUrl = blobs[0].downloadUrl;

    // Stream the blob to the client
    const blobRes = await fetch(downloadUrl);
    if (!blobRes.ok || !blobRes.body) {
      res.status(502).send("Download failed");
      return;
    }

    res.setHeader("Content-Type", "application/gzip");
    res.setHeader("Content-Disposition", `attachment; filename="throughline-latest.tar.gz"`);
    res.setHeader("Cache-Control", "no-store");

    // Stream the response
    const reader = blobRes.body.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const buffer = Buffer.concat(chunks);
    res.status(200).send(buffer);
  } catch (err) {
    console.error("Download error:", err);
    res.status(502).send("Download failed");
  }
}
