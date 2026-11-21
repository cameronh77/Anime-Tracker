import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db/index.ts';
import * as schema from './db/schema.ts';
import { env } from './env.ts';

const LAN_DEV_ORIGIN = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):5173$/;

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  // The frontend's URL: in dev, Vite proxies /api to this server, so cookies
  // are set on the frontend's origin.
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  trustedOrigins: (request) => {
    const origins = [env.BETTER_AUTH_URL];
    // In development, also trust the Vite dev server opened from another
    // device on your Wi-Fi (e.g. http://192.168.1.20:5173 on your phone).
    const origin = request?.headers.get('origin');
    if (process.env.NODE_ENV !== 'production' && origin && LAN_DEV_ORIGIN.test(origin)) {
      origins.push(origin);
    }
    return origins;
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: { enabled: true },
});

export type Session = typeof auth.$Infer.Session;
