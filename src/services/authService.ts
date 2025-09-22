import crypto from 'crypto';
import Joi from 'joi';
import { createUser, findUserByEmail, User } from '../models/user';
import { comparePassword, hashPassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { insertRefreshToken, findRefreshTokenByHash, updateLastUsed } from '../models/refreshToken';
import { env } from '../config/env';

export const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  declared_interests: Joi.array().items(Joi.string()).default([]),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export async function signup(input: { email: string; password: string; declared_interests?: string[] }): Promise<{ user: User; access_token: string; refresh_token: string; }>{
  const { email, password, declared_interests = [] } = await signupSchema.validateAsync(input);

  const existing = await findUserByEmail(email);
  if (existing) {
    const err: any = new Error('Email already in use');
    err.status = 409;
    throw err;
  }

  const password_hash = await hashPassword(password);
  const user = await createUser(email, password_hash, declared_interests);

  const access_token = signAccessToken({ id: user.id, email: user.email });
  const refresh_token = signRefreshToken({ id: user.id, email: user.email });

  const token_hash = crypto.createHash('sha256').update(refresh_token).digest('hex');
  const expires_at = new Date(Date.now() + parseDuration(env.jwt.refreshExpiresIn)).toISOString();
  await insertRefreshToken({ user_id: user.id, token_hash, expires_at, is_revoked: false });

  return { user, access_token, refresh_token };
}

export async function login(input: { email: string; password: string; userAgent?: string; ip?: string; }): Promise<{ user: User; access_token: string; refresh_token: string; }>{
  const { email, password } = await loginSchema.validateAsync({ email: input.email, password: input.password });

  const user = await findUserByEmail(email);
  if (!user) {
    const err: any = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const ok = await comparePassword(password, user.password_hash);
  if (!ok) {
    const err: any = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const access_token = signAccessToken({ id: user.id, email: user.email });
  const refresh_token = signRefreshToken({ id: user.id, email: user.email });
  const token_hash = crypto.createHash('sha256').update(refresh_token).digest('hex');
  const expires_at = new Date(Date.now() + parseDuration(env.jwt.refreshExpiresIn)).toISOString();
  await insertRefreshToken({ user_id: user.id, token_hash, expires_at, is_revoked: false });

  return { user, access_token, refresh_token };
}

export async function refresh(input: { refresh_token: string }): Promise<{ access_token: string; refresh_token: string }>{
  const { refresh_token } = input;
  if (!refresh_token) {
    const err: any = new Error('refresh_token is required');
    err.status = 400;
    throw err;
  }

  const payload = verifyRefreshToken(refresh_token);
  const token_hash = crypto.createHash('sha256').update(refresh_token).digest('hex');
  const stored = await findRefreshTokenByHash(token_hash);
  if (!stored || stored.is_revoked) {
    const err: any = new Error('Invalid refresh token');
    err.status = 401;
    throw err;
  }
  if (new Date(stored.expires_at).getTime() < Date.now()) {
    const err: any = new Error('Refresh token expired');
    err.status = 401;
    throw err;
  }

  await updateLastUsed(token_hash);

  const newAccess = signAccessToken({ id: payload.id, email: payload.email });
  const newRefresh = signRefreshToken({ id: payload.id, email: payload.email });
  // Optionally rotate store; minimal MVP returns tokens without rotating persistence for brevity
  return { access_token: newAccess, refresh_token: newRefresh };
}

function parseDuration(s: string): number {
  // supports '15m', '7d', '1h'
  const m = s.match(/^(\d+)([smhd])$/);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  switch (unit) {
    case 's': return n * 1000;
    case 'm': return n * 60 * 1000;
    case 'h': return n * 60 * 60 * 1000;
    case 'd': return n * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}
