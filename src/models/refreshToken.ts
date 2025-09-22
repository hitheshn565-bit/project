import { db } from '../config/db';

export interface RefreshToken {
  id: number;
  user_id: string;
  token_hash: string;
  expires_at: string;
  is_revoked: boolean;
  user_agent?: string | null;
  ip_address?: string | null;
  created_at?: string;
  last_used_at?: string;
}

const Table = 'refresh_tokens';

export async function insertRefreshToken(token: Omit<RefreshToken, 'id' | 'created_at' | 'last_used_at'>): Promise<RefreshToken> {
  const [row] = await db<RefreshToken>(Table).insert(token).returning('*');
  return row;
}

export async function findRefreshTokenByHash(token_hash: string): Promise<RefreshToken | undefined> {
  return db<RefreshToken>(Table).where({ token_hash }).first();
}

export async function revokeRefreshToken(token_hash: string): Promise<void> {
  await db<RefreshToken>(Table).where({ token_hash }).update({ is_revoked: true });
}

export async function updateLastUsed(token_hash: string): Promise<void> {
  await db<RefreshToken>(Table).where({ token_hash }).update({ last_used_at: db.fn.now() });
}

export async function revokeAllForUser(user_id: string): Promise<void> {
  await db<RefreshToken>(Table).where({ user_id }).update({ is_revoked: true });
}
