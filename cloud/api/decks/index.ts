import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { getDb } from '../_lib/db.js';
import { decks } from '../_lib/schema.js';
import { requireAuth } from '../_lib/auth.js';
import { ensureTables } from '../_lib/migrate.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await requireAuth(req, res);
  if (!session) return;

  try {
    await ensureTables();
    const db = getDb();

    const userDecks = await db.select()
      .from(decks)
      .where(eq(decks.presenterId, session.sub))
      .orderBy(decks.updatedAt);

    // Return in DeckManifest format
    return res.status(200).json({
      decks: userDecks.map((d) => ({
        id: d.slug,
        title: d.title,
        updatedAt: d.updatedAt.toISOString(),
        slideCount: undefined,
        published: true,
        publishedAt: d.publishedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('List decks error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
