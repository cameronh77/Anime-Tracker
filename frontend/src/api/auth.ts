import { createAuthClient } from 'better-auth/react';

// Talks to the backend's Better Auth endpoints at /api/auth/* (proxied by Vite
// in dev). The session is kept in an http-only cookie set by the backend.
export const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: '/api/auth',
});

export const { useSession, signIn, signUp, signOut } = authClient;
