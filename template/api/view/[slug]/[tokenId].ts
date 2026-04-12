import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, like } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { getDb } from '../../lib/db.js';
import { decks, shareTokens } from '../../lib/schema.js';
import { ensureTables } from '../../lib/migrate.js';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-me'
);
const VIEWER_COOKIE = 'shine_viewer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = req.query.slug as string;
  const tokenId = req.query.tokenId as string;

  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  // Handle meta requests (tokenId = "meta" or ?meta=true)
  if (tokenId === 'meta' || req.query.meta === 'true') {
    return handleMeta(req, res, slug, typeof req.query.shareToken === 'string' ? req.query.shareToken : undefined);
  }

  if (!tokenId) return res.status(400).json({ error: 'Missing tokenId' });

  if (req.method === 'POST') return handleVerify(req, res, slug, tokenId);
  if (req.method === 'GET') return handleGetDeck(req, res, slug, tokenId);

  return res.status(405).json({ error: 'Method not allowed' });
}

/** GET meta — returns deck title + share token validity (public, no auth) */
async function handleMeta(req: VercelRequest, res: VercelResponse, slug: string, tokenId?: string) {
  try {
    await ensureTables();
    const db = getDb();

    const [deck] = await db.select({ title: decks.title, id: decks.id })
      .from(decks).where(eq(decks.slug, slug)).limit(1);

    if (!deck) return res.status(404).json({ error: 'Deck not found' });

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

/** POST — verify password, issue viewer JWT */
async function handleVerify(req: VercelRequest, res: VercelResponse, slug: string, shortId: string) {
  try {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: 'Password required' });

    await ensureTables();
    const db = getDb();

    // Find deck
    const [deck] = await db.select().from(decks).where(eq(decks.slug, slug)).limit(1);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    // Find share token by short ID prefix
    const tokens = await db.select().from(shareTokens)
      .where(and(eq(shareTokens.deckId, deck.id), like(shareTokens.id, `${shortId}%`)));

    const token = tokens[0];
    if (!token) return res.status(404).json({ error: 'Share link not found' });

    // Check expiry
    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'This share link has expired' });
    }

    // Verify password
    const valid = await compare(password, token.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Incorrect password' });

    // Issue viewer JWT (4 hours)
    const viewerToken = await new SignJWT({
      type: 'viewer',
      deckId: deck.id,
      slug,
      tokenId: token.id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('viewer')
      .setExpirationTime('4h')
      .sign(JWT_SECRET);

    // Set cookie
    res.setHeader('Set-Cookie', [
      `${VIEWER_COOKIE}=${viewerToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${4 * 60 * 60}`,
    ]);

    return res.status(200).json({ ok: true, title: deck.title });
  } catch (err) {
    console.error('Viewer verify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** GET — serve deck config to authenticated viewer */
async function handleGetDeck(req: VercelRequest, res: VercelResponse, slug: string, shortId: string) {
  try {
    // Check viewer JWT from cookie
    const cookies = req.headers.cookie || '';
    const match = cookies.match(new RegExp(`(?:^|;\\s*)${VIEWER_COOKIE}=([^;]*)`));
    if (!match) return res.status(401).json({ error: 'Not authenticated', needsPassword: true });

    const { payload } = await jwtVerify(match[1], JWT_SECRET);
    if (payload.type !== 'viewer' || payload.slug !== slug) {
      return res.status(401).json({ error: 'Invalid viewer session', needsPassword: true });
    }

    await ensureTables();
    const db = getDb();

    const [deck] = await db.select().from(decks).where(eq(decks.slug, slug)).limit(1);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    // Verify the share token still exists and isn't expired
    const tokens = await db.select().from(shareTokens)
      .where(and(eq(shareTokens.deckId, deck.id), like(shareTokens.id, `${shortId}%`)));

    const token = tokens[0];
    if (!token) return res.status(404).json({ error: 'Share link revoked' });
    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'Share link expired' });
    }

    // Fetch deck from blob
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const blobRes = await fetch(deck.blobUrl, {
      headers: blobToken ? { 'Authorization': `Bearer ${blobToken}` } : {},
    });
    if (!blobRes.ok) return res.status(502).json({ error: 'Failed to load deck' });

    const config = await blobRes.json();
    return res.status(200).json(config);
  } catch {
    return res.status(401).json({ error: 'Session expired', needsPassword: true });
  }
}
