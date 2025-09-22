import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(env.security.bcryptRounds);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
