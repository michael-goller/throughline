import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { del } from '@vercel/blob';
import { getDb } from '../lib/db.js';
import { decks } from '../lib/schema.js';
import { requireAuth } from '../lib/auth.js';
import { ensureTables } from '../lib/migrate.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = req.query.slug as string;
  if (!slug) {
    return res.status(400).json({ error: 'Missing slug parameter' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res, slug);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res, slug);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(_req: VercelRequest, res: VercelResponse, slug: string) {
  try {
    await ensureTables();
    const db = getDb();

    const [deck] = await db.select()
      .from(decks)
      .where(eq(decks.slug, slug))
      .limit(1);

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    // Fetch the deck config from Vercel Blob (private store requires token)
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const blobRes = await fetch(deck.blobUrl, {
      headers: blobToken ? { 'Authorization': `Bearer ${blobToken}` } : {},
    });
    if (!blobRes.ok) {
      return res.status(502).json({ error: 'Failed to load deck from storage' });
    }

    const config = await blobRes.json();
    return res.status(200).json(config);
  } catch (err) {
    console.error('Get deck error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

async function handleDelete(req: VercelRequest, res: VercelResponse, slug: string) {
  const session = await requireAuth(req, res);
  if (!session) return;

  try {
    await ensureTables();
    const db = getDb();

    const [deck] = await db.select()
      .from(decks)
      .where(eq(decks.slug, slug))
      .limit(1);

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    if (deck.presenterId !== session.sub) {
      return res.status(403).json({ error: 'Not authorized to delete this deck' });
    }

    // Delete from Blob storage
    try {
      await del(deck.blobUrl);
    } catch {
      // Blob may already be gone — continue with DB deletion
    }

    // Delete from database
    await db.delete(decks).where(eq(decks.id, deck.id));

    return res.status(200).json({ deleted: true });
  } catch (err) {
    console.error('Delete deck error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
