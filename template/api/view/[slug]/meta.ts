import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, like } from 'drizzle-orm';
import { getDb } from '../../lib/db.js';
import { decks, shareTokens } from '../../lib/schema.js';
import { ensureTables } from '../../lib/migrate.js';

/** Public endpoint — returns deck title + share token validity (no auth needed) */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const slug = req.query.slug as string;
  const tokenId = req.query.tokenId as string;

  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  try {
    await ensureTables();
    const db = getDb();

    const [deck] = await db.select({ title: decks.title, id: decks.id })
      .from(decks).where(eq(decks.slug, slug)).limit(1);

    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    // If tokenId provided, check if the share token is still valid
    if (tokenId) {
      const tokens = await db.select({ id: shareTokens.id, expiresAt: shareTokens.expiresAt })
        .from(shareTokens)
        .where(and(eq(shareTokens.deckId, deck.id), like(shareTokens.id, `${tokenId}%`)));

      const token = tokens[0];
      if (!token) return res.status(404).json({ error: 'Share link not found' });
      if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
        return res.status(410).json({ error: 'Share link expired', title: deck.title });
      }
    }

    return res.status(200).json({ title: deck.title });
  } catch (err) {
    console.error('View meta error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
