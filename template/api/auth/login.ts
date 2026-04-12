import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from '../lib/db.js';
import { presenters } from '../lib/schema.js';
import { signToken, setSessionCookie } from '../lib/auth.js';
import { ensureTables } from '../lib/migrate.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    await ensureTables();

    const db = getDb();
    const [presenter] = await db.select()
      .from(presenters)
      .where(eq(presenters.email, email.toLowerCase().trim()))
      .limit(1);

    if (!presenter) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, presenter.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = await signToken({
      sub: presenter.id,
      email: presenter.email,
      name: presenter.name,
    });

    setSessionCookie(res, token);

    return res.status(200).json({
      id: presenter.id,
      email: presenter.email,
      name: presenter.name,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
