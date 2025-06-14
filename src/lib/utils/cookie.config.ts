// src/utils/cookie.config.ts
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // More flexible than 'strict'
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  domain: process.env.COOKIE_DOMAIN || 'localhost',
};
