import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../app.ts';
import { db } from '../db/index.ts';
import { anime, libraryEntries } from '../db/schema.ts';

// Example route to build on: the signed-in user's library, with anime details.
export const library = new Hono<AppEnv>();

library.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Not signed in' }, 401);

  const rows = await db
    .select({ entry: libraryEntries, anime })
    .from(libraryEntries)
    .innerJoin(anime, eq(libraryEntries.animeId, anime.malId))
    .where(eq(libraryEntries.userId, user.id));

  return c.json(rows);
});
