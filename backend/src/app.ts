import { Hono } from 'hono';
import { auth, type Session } from './auth.ts';
import { library } from './routes/library.ts';

export type AppEnv = {
  Variables: {
    user: Session['user'] | null;
    session: Session['session'] | null;
  };
};

export const app = new Hono<AppEnv>().basePath('/api');

// Look up the session cookie on every request so routes can use c.get('user').
app.use('*', async (c, next) => {
  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set('user', result?.user ?? null);
  c.set('session', result?.session ?? null);
  await next();
});

// Sign up / sign in / sign out etc. are all handled by Better Auth.
app.on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw));

app.get('/health', (c) => c.json({ ok: true }));
app.route('/library', library);
