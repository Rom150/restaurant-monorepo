import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

export function genRefreshTokenRaw(): string {
  return crypto.randomBytes(64).toString('hex'); // 128 chars hex
}

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export async function compareToken(
  token: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(token, hash);
}
