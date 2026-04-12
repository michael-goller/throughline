import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from '../_lib/db.js';
import { presenters } from '../_lib/schema.js';
import { signToken, setSessionCookie } from '../_lib/auth.js';
import { ensureTables } from '../_lib/migrate.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body || {};

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    await ensureTables();

    const db = getDb();
    const existing = await db.select({ id: presenters.id })
      .from(presenters)
      .where(eq(presenters.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [presenter] = await db.insert(presenters).values({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
    }).returning();

    const token = await signToken({
      sub: presenter.id,
      email: presenter.email,
      name: presenter.name,
    });

    setSessionCookie(res, token);

    return res.status(201).json({
      id: presenter.id,
      email: presenter.email,
      name: presenter.name,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
