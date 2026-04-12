import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { getDb } from '../../_lib/db.js';
import { decks, shareTokens } from '../../_lib/schema.js';
import { requireAuth } from '../../_lib/auth.js';
import { ensureTables } from '../../_lib/migrate.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = req.query.slug as string;
  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  if (req.method === 'POST') return handleCreate(req, res, slug);
  if (req.method === 'GET') return handleList(req, res, slug);
  if (req.method === 'DELETE') return handleDelete(req, res, slug);

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleCreate(req: VercelRequest, res: VercelResponse, slug: string) {
  const session = await requireAuth(req, res);
  if (!session) return;

  try {
    const { password, label, expiresAt } = req.body || {};
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    await ensureTables();
    const db = getDb();

    const [deck] = await db.select().from(decks)
      .where(and(eq(decks.slug, slug), eq(decks.presenterId, session.sub)))
      .limit(1);

    if (!deck) return res.status(404).json({ error: 'Deck not found or not yours' });

    const passwordHash = await hash(password, 10);
    const [token] = await db.insert(shareTokens).values({
      deckId: deck.id,
      passwordHash,
      label: label || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    }).returning();

    const tokenId = token.id.split('-')[0]; // Short ID for URLs
    const baseUrl = `https://${req.headers.host || 'shine-one-sigma.vercel.app'}`;
    const viewUrl = `${baseUrl}/view/${slug}/${tokenId}`;

    return res.status(201).json({
      tokenId: token.id,
      shortId: tokenId,
      label: token.label,
      expiresAt: token.expiresAt,
      viewUrl,
    });
  } catch (err) {
    console.error('Share create error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleList(req: VercelRequest, res: VercelResponse, slug: string) {
  const session = await requireAuth(req, res);
  if (!session) return;

  try {
    await ensureTables();
    const db = getDb();

    const [deck] = await db.select().from(decks)
      .where(and(eq(decks.slug, slug), eq(decks.presenterId, session.sub)))
      .limit(1);

    if (!deck) return res.status(404).json({ error: 'Deck not found or not yours' });

    const tokens = await db.select({
      id: shareTokens.id,
      label: shareTokens.label,
      createdAt: shareTokens.createdAt,
      expiresAt: shareTokens.expiresAt,
    }).from(shareTokens).where(eq(shareTokens.deckId, deck.id));

    const baseUrl = `https://${req.headers.host || 'shine-one-sigma.vercel.app'}`;
    const result = tokens.map(t => ({
      ...t,
      shortId: t.id.split('-')[0],
      viewUrl: `${baseUrl}/view/${slug}/${t.id.split('-')[0]}`,
    }));

    return res.status(200).json(result);
  } catch (err) {
    console.error('Share list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDelete(req: VercelRequest, res: VercelResponse, slug: string) {
  const session = await requireAuth(req, res);
  if (!session) return;

  try {
    const { tokenId } = req.body || {};
    const all = req.body?.all === true;

    await ensureTables();
    const db = getDb();

    const [deck] = await db.select().from(decks)
      .where(and(eq(decks.slug, slug), eq(decks.presenterId, session.sub)))
      .limit(1);

    if (!deck) return res.status(404).json({ error: 'Deck not found or not yours' });

    if (all) {
      await db.delete(shareTokens).where(eq(shareTokens.deckId, deck.id));
      return res.status(200).json({ deleted: 'all' });
    }

    if (!tokenId) return res.status(400).json({ error: 'tokenId or all:true required' });

    await db.delete(shareTokens)
      .where(and(eq(shareTokens.id, tokenId), eq(shareTokens.deckId, deck.id)));

    return res.status(200).json({ deleted: tokenId });
  } catch (err) {
    console.error('Share delete error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
