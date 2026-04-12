import { neon } from '@neondatabase/serverless';

export async function ensureTables() {
  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    CREATE TABLE IF NOT EXISTS presenters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS decks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      presenter_id UUID NOT NULL REFERENCES presenters(id),
      slug VARCHAR(255) NOT NULL UNIQUE,
      title VARCHAR(500) NOT NULL,
      blob_url TEXT NOT NULL,
      published_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS share_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      password_hash TEXT NOT NULL,
      label VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP
    )
  `;
}
