// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

type LoginOptions = {
  ip?: string;
  userAgent?: string;
};

function toStringSafe(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v === null || v === undefined) return '';
  return String(v);
}

@Injectable()
export class AuthService {
  async login(dto: { email: string; password: string }, opts?: LoginOptions) {
    const email = toStringSafe(dto.email);
    const password = toStringSafe(dto.password);

    const secret = toStringSafe(process.env.AUTH_SECRET ?? process.env.JWT_SECRET);
    const hmac = crypto.createHmac('sha256', Buffer.from(secret));
    hmac.update(password);
    const token = hmac.digest('hex');

    return {
      accessToken: token,
      email,
      meta: { ip: opts?.ip ?? '', userAgent: opts?.userAgent ?? '' },
    };
  }
}
