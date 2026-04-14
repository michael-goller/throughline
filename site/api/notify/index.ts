import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put, get } from '@vercel/blob';

const BLOB_KEY = 'shine-cloud-signups.json';

interface Signup {
  email: string;
  timestamp: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    let signups: Signup[] = [];
    try {
      const existing = await get(BLOB_KEY);
      if (existing) {
        const text = await existing.text();
        signups = JSON.parse(text);
      }
    } catch {
      signups = [];
    }

    if (signups.some((s) => s.email === normalizedEmail)) {
      return res.status(200).json({ message: "You're already on the list!" });
    }

    signups.push({ email: normalizedEmail, timestamp: new Date().toISOString() });

    await put(BLOB_KEY, JSON.stringify(signups, null, 2), {
      access: 'private',
      addRandomSuffix: false,
    });

    return res.status(200).json({ message: "You're on the list! We'll notify you when Shine Cloud launches." });
  } catch (err) {
    console.error('Notify signup error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
