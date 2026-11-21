import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// ─── Auth tables (shape required by Better Auth) ────────────────────────────

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Anime cache ────────────────────────────────────────────────────────────
// Mirrors AnimeSnapshot in frontend/src/types.ts. Filled from AniList so we don't
// depend on its rate limit for every page view.

export const anime = pgTable('anime', {
  malId: integer('mal_id').primaryKey(),
  title: text('title').notNull(),
  image: text('image').notNull(),
  type: text('type'),
  episodes: integer('episodes'),
  year: integer('year'),
  genres: text('genres').array().notNull().default([]),
  studios: text('studios').array().notNull().default([]),
  fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
});

// ─── User data (mirrors LibraryState in frontend/src/types.ts) ──────────────

export const watchStatus = pgEnum('watch_status', [
  'watching',
  'completed',
  'on_hold',
  'dropped',
  'plan_to_watch',
]);

/** One row per anime in a user's library (LibraryEntry). */
export const libraryEntries = pgTable(
  'library_entries',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId),
    status: watchStatus('status').notNull(),
    episodesWatched: integer('episodes_watched').notNull().default(0),
    rating: real('rating'), // 0.5 – 5 in half steps
    liked: boolean('liked').notNull().default(false),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.animeId] })],
);

/** A single watch/finish event, optionally with a review (DiaryEntry). */
export const diaryEntries = pgTable(
  'diary_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId),
    watchedOn: date('watched_on').notNull(),
    rating: real('rating'),
    liked: boolean('liked').notNull().default(false),
    rewatch: boolean('rewatch').notNull().default(false),
    review: text('review').notNull().default(''),
    spoilers: boolean('spoilers').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('diary_user_watched_idx').on(t.userId, t.watchedOn)],
);

/** A user-made list (AnimeList). Items live in listItems. */
export const lists = pgTable('lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  ranked: boolean('ranked').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const listItems = pgTable(
  'list_items',
  {
    listId: uuid('list_id')
      .notNull()
      .references(() => lists.id, { onDelete: 'cascade' }),
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId),
    position: integer('position').notNull(),
  },
  (t) => [primaryKey({ columns: [t.listId, t.animeId] })],
);

/** Up to 4 favourites shown on a profile, ordered by position (0–3). */
export const favourites = pgTable(
  'favourites',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    animeId: integer('anime_id')
      .notNull()
      .references(() => anime.malId),
    position: smallint('position').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.animeId] }),
    unique('favourites_user_position').on(t.userId, t.position),
  ],
);

/** Social graph: followerId follows followingId. */
export const follows = pgTable(
  'follows',
  {
    followerId: text('follower_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    followingId: text('following_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followingId] }),
    index('follows_following_idx').on(t.followingId),
  ],
);
