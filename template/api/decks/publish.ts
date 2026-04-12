import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../lib/db.js';
import { decks } from '../lib/schema.js';
import { requireAuth } from '../lib/auth.js';
import { ensureTables } from '../lib/migrate.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await requireAuth(req, res);
  if (!session) return;

  try {
    const { slug, title, description, config } = req.body || {};

    if (!slug || !title || !config) {
      return res.status(400).json({ error: 'slug, title, and config are required' });
    }

    if (!config.slides || !Array.isArray(config.slides) || config.slides.length === 0) {
      return res.status(400).json({ error: 'config must contain a non-empty slides array' });
    }

    await ensureTables();
    const db = getDb();

    // Upload config JSON to Vercel Blob
    const blobPath = `decks/${session.sub}/${slug}.json`;
    const blob = await put(blobPath, JSON.stringify(config), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
    });

    // Upsert the deck record
    const [existing] = await db.select()
      .from(decks)
      .where(and(eq(decks.presenterId, session.sub), eq(decks.slug, slug)))
      .limit(1);

    if (existing) {
      await db.update(decks)
        .set({
          title,
          blobUrl: blob.url,
          updatedAt: new Date(),
        })
        .where(eq(decks.id, existing.id));
    } else {
      await db.insert(decks).values({
        presenterId: session.sub,
        slug,
        title,
        blobUrl: blob.url,
      });
    }

    const baseUrl = `https://${req.headers.host || 'localhost:5173'}`;
    return res.status(200).json({
      slug,
      title,
      url: `${baseUrl}/decks/${slug}`,
      blobUrl: blob.url,
      publishedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Publish error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
